import type { HTTPFunctionsMeta } from '@vramework/core/http'

export const serializeRouteMeta = (routesMeta: HTTPFunctionsMeta) => {
  const serializedOutput: string[] = []
  serializedOutput.push("import { setHTTPFunctionsMeta } from '@vramework/core'")
  serializedOutput.push(`setHTTPFunctionsMeta(${JSON.stringify(routesMeta, null, 2)})`)
  return serializedOutput.join('\n')
}
