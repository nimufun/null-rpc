import type { PlanConfig, PlanType } from '@/types'

export const PLANS: Record<PlanType, PlanConfig> = {
  business: { requestsPerMonth: 250_000_000, requestsPerSecond: 500 },
  enterprise: { requestsPerMonth: Number.POSITIVE_INFINITY, requestsPerSecond: Number.POSITIVE_INFINITY },
  hobbyist: { requestsPerMonth: 100_000, requestsPerSecond: 10 },
  scaling: { requestsPerMonth: 50_000_000, requestsPerSecond: 100 }
}
