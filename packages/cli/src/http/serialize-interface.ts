import { HTTPFunctionsMeta } from '@vramework/core/http'
import { ImportMap } from '../inspector/inspector.js'
import { serializeImportMap } from '../core/serialize-import-map.js'

export const serializeInterface = (
  relativeTo: string,
  importMap: ImportMap,
  routesMeta: HTTPFunctionsMeta,
  packageMappings: Record<string, string>
) => {
  const serializedOutput: string[] = []
  serializedOutput.push(
    serializeImportMap(relativeTo, packageMappings, importMap)
  )

  let routesInterface = 'export type RoutesInterface = '
  if (routesMeta.length === 0) {
    routesInterface += 'never'
  } else {
    const result = routesMeta.map(
      ({ route, method, input, output }) =>
        `{ route: '${route}', method: '${method}', input: ${input}, output: ${output} }`
    )
    routesInterface += result.join(' |\n\t')
  }
  serializedOutput.push(routesInterface)

  return serializedOutput.join('\n')
}
