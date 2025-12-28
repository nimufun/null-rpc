/**
 * Public stats response structure
 * Only includes aggregate, non-sensitive data
 */
export interface PublicStats {
  totalRequests: number
  cacheHitRate: number
  avgLatencyMs: number
  requestsByChain: Record<string, number>
  requestsByMethod: Record<string, number>
  uptimePercent: number
}

export interface AnalyticsData {
  // Request identification (non-personal)
  chain: string
  method: string

  // Cache metrics
  cacheStatus: 'HIT' | 'MISS' | 'BYPASS' | 'NONE'

  // Response metrics
  statusCode: number
  latencyMs: number

  // Size metrics (optional, when available)
  requestSize?: number
  responseSize?: number

  // Error tracking (generic types only, no user context)
  errorType?: string
}
