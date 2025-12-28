import { DurableObject } from 'cloudflare:workers'
import { PLANS } from '@/constants'
import type { PlanType, RateLimitResult, SessionState, UserRecord } from '@/types'

export class UserSession extends DurableObject {
  protected state: DurableObjectState
  protected env: Env
  private session: SessionState | null = null
  private initialized = false

  constructor(state: DurableObjectState, env: Env) {
    super(state, env)
    this.state = state
    this.env = env
  }

  /**
   * Main entry point for rate limiting
   */
  async checkLimit(token: string): Promise<RateLimitResult> {
    if (!this.initialized) {
      await this.loadState(token)
      this.initialized = true
    }

    if (!this.session) {
      return { allowed: false, reason: 'user_not_found', remaining: 0 }
    }

    const plan = PLANS[this.session.record.plan]
    const now = Date.now()

    // 1. Check Monthly Reset
    if (this.isNewMonth(this.session.record.month_reset_at, now)) {
      this.session.record.current_month_requests = 0
      this.session.record.month_reset_at = now
      this.session.dirty = true
    }

    // 2. Check Monthly Quota
    if (this.session.record.current_month_requests >= plan.requestsPerMonth) {
      if (this.session.dirty) this.flushState()
      return { allowed: false, reason: 'monthly_limit', remaining: 0 }
    }

    // 3. Token Bucket Check (In-Memory)
    this.refillTokens(this.session, plan.requestsPerSecond, now)

    if (this.session.tokens < 1) {
      // Typically we don't flush purely on 429 to save writes, but we can if we want perfect counters
      if (this.session.dirty) this.flushState()
      return { allowed: false, reason: 'rate_limit', remaining: 0 }
    }

    // 4. Consume & Success
    this.session.tokens -= 1
    this.session.record.current_month_requests += 1
    this.session.dirty = true

    // Optimistic flush (async)
    // Could debounce this for higher performance
    this.state.waitUntil(this.flushState())

    return {
      allowed: true,
      remaining: plan.requestsPerMonth - this.session.record.current_month_requests
    }
  }

  // --- Internals ---

  private async loadState(token: string) {
    // try load from D1
    const result = await this.env.DB.prepare('SELECT * FROM users WHERE token = ?').bind(token).first<UserRecord>()

    if (result) {
      this.session = {
        dirty: false,
        lastRefill: Date.now(),
        record: result,
        tokens: PLANS[result.plan].requestsPerSecond
      }
      return
    }

    // -------------------------------------------------------------------------
    // Auto-Seed Logic (D1 Version)
    // -------------------------------------------------------------------------
    if (token.startsWith('user_')) {
      const planMap: Record<string, PlanType> = {
        user_business: 'business',
        user_enterprise: 'enterprise',
        user_hobbyist: 'hobbyist',
        user_scaling: 'scaling'
      }

      if (planMap[token]) {
        const now = Date.now()
        const plan = planMap[token]
        const address = `0x_auto_${plan}`

        try {
          await this.env.DB.prepare(
            `INSERT INTO users (token, plan, created_at, current_month_requests, month_reset_at, address)
             VALUES (?, ?, ?, 0, ?, ?)`
          )
            .bind(token, plan, now, now, address)
            .run()

          this.session = {
            dirty: false,
            lastRefill: now,
            record: { address, created_at: now, current_month_requests: 0, month_reset_at: now, plan, token },
            tokens: PLANS[plan].requestsPerSecond
          }
        } catch {
          // Ignore unique constraint if race condition
        }
      }
    }
  }

  private async flushState() {
    if (!this.session || !this.session.dirty) return

    await this.env.DB.prepare(
      `UPDATE users 
       SET current_month_requests = ?, month_reset_at = ?
       WHERE token = ?`
    )
      .bind(this.session.record.current_month_requests, this.session.record.month_reset_at, this.session.record.token)
      .run()

    this.session.dirty = false
  }

  private refillTokens(state: SessionState, rps: number, now: number) {
    const elapsed = (now - state.lastRefill) / 1000
    if (elapsed <= 0) return

    const newTokens = elapsed * rps
    const maxTokens = rps * 1.5 // Burst capacity

    state.tokens = Math.min(maxTokens, state.tokens + newTokens)
    state.lastRefill = now
  }

  private isNewMonth(lastTimestamp: number, now: number): boolean {
    const last = new Date(lastTimestamp)
    const current = new Date(now)
    return last.getMonth() !== current.getMonth() || last.getFullYear() !== current.getFullYear()
  }
}
