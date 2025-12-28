import type { PlanType } from './plans'

export interface UserRecord {
  token: string
  plan: PlanType
  created_at: number
  current_month_requests: number
  month_reset_at: number
  address: string
}

export interface SessionState {
  tokens: number
  lastRefill: number
  record: UserRecord
  dirty: boolean
}
