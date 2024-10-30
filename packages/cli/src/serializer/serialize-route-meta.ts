import type { RoutesMeta } from '@vramework/core'

export const serializeRouteMeta = (routesMeta: RoutesMeta) => {
  const serializedOutput: string[] = []
  serializedOutput.push("import { addRouteMeta } from '@vramework/core'")
  serializedOutput.push(`addRouteMeta(${JSON.stringify(routesMeta, null, 2)})`)
  return serializedOutput.join('\n')
}
