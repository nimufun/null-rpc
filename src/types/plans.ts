export type PlanType = 'hobbyist' | 'scaling' | 'business' | 'enterprise'

export interface PlanConfig {
  requestsPerMonth: number
  requestsPerSecond: number
}
