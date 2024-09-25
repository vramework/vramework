import { RoutesMeta } from '@vramework/core'
import { ImportMap } from './inspect-routes'
import { getFileImportRelativePath } from './utils'

export const serializeRoutes = (outputPath: string, filesWithRoutes: string[], packageMappings: Record<string, string> = {}) => {
  const serializedOutput: string[] = ['/* Files with addRoute function within them */']

  filesWithRoutes
    .sort()
    .forEach((path) => {
      const filePath = getFileImportRelativePath(outputPath, path, packageMappings)
      serializedOutput.push(`import '${filePath}'`)
    })

  return serializedOutput.join('\n')
}

const serializeImportMap = (importMap: ImportMap) => {
  let imports: string[] = []
  for (const [importPath, { namedImports }] of importMap) {
    imports.push(`import { ${Array.from(namedImports).join(', ')} } from '${importPath.replace('.ts', '')}'`)
  }
  return imports.join('\n')
}

export const serializeInterface = (importMap: ImportMap, routesMeta: RoutesMeta) => {
  const serializedOutput: string[] = ['/* Files with addRoute function within them */']
  serializedOutput.push(serializeImportMap(importMap))
  
  let routesInterface = 'export type RoutesInterface = '
  const result = routesMeta.map(({ route, method, input, output }) => `{ route: '${route}', method: '${method}', input: ${input}, output: ${output} }`)
  routesInterface += result.join(' |\n\t')
  serializedOutput.push(routesInterface)
  
  return serializedOutput.join('\n')
}

export const serializeRouteMeta = (routesMeta: RoutesMeta) => {
  const serializedOutput: string[] = ['/* Files with addRoute function within them */']
  serializedOutput.push('import { addRouteMeta } from \'@vramework/core\'')
  serializedOutput.push(`addRouteMeta(${JSON.stringify(routesMeta, null, 2)})`)
  return serializedOutput.join('\n')
}

