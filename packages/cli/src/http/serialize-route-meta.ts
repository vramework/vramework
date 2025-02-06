import type { HTTPRoutesMeta } from '@pikku/core/http'

export const serializeHTTPRoutesMeta = (routesMeta: HTTPRoutesMeta) => {
  const serializedOutput: string[] = []
  serializedOutput.push(
    "import { setHTTPRoutesMeta } from '@pikku/core/http'"
  )
  serializedOutput.push(
    `setHTTPRoutesMeta(${JSON.stringify(routesMeta, null, 2)})`
  )
  return serializedOutput.join('\n')
}
