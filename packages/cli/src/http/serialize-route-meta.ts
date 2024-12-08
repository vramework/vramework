import type { RoutesMeta } from '@vramework/core/http'

export const serializeRouteMeta = (routesMeta: RoutesMeta) => {
  const serializedOutput: string[] = []
  serializedOutput.push("import { setRoutesMeta } from '@vramework/core'")
  serializedOutput.push(`setRoutesMeta(${JSON.stringify(routesMeta, null, 2)})`)
  return serializedOutput.join('\n')
}
