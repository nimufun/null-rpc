import { createRawJsonResponse } from '@/utils'

export function handleRoot(): Response {
  return createRawJsonResponse(
    JSON.stringify({
      id: 1,
      jsonrpc: '2.0',
      result: true
    })
  )
}
