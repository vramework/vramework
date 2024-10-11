import { RoutesMeta } from '@vramework/core/types/routes.types'
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
  if (routesMeta.length === 0) {
    routesInterface += 'never'
  } else {
    const result = routesMeta.map(({ route, method, input, output }) => `{ route: '${route}', method: '${method}', input: ${input}, output: ${output} }`)
    routesInterface += result.join(' |\n\t')
  }
  serializedOutput.push(routesInterface)

  return serializedOutput.join('\n')
}

export const serializeRouteMeta = (routesMeta: RoutesMeta) => {
  const serializedOutput: string[] = ['/* Files with addRoute function within them */']
  serializedOutput.push('import { addRouteMeta } from \'@vramework/core\'')
  serializedOutput.push(`addRouteMeta(${JSON.stringify(routesMeta, null, 2)})`)
  return serializedOutput.join('\n')
}

export const serailizeTypedRouteRunner = (importMap: ImportMap, routesMeta: RoutesMeta) => {
  return `
// The typed route runner allows us to infer our types when running routes
import { runRoute, CoreSingletonServices, CreateSessionServices, VrameworkRequest, VrameworkResponse } from '@vramework/core'
${serializeImportMap(importMap)}

interface RouteHandler<I, O> {
  input: I;
  output: O;
}

${generateRoutes(routesMeta)}
export type RoutesMap = typeof routes;

export type RouteHandlerOf<Route extends keyof RoutesMap, Method extends keyof RoutesMap[Route]> =
  RoutesMap[Route][Method] extends { input: infer I; output: infer O }
    ? RouteHandler<I, O>
    : never;

export const runTypedRoute = async <
  Route extends keyof RoutesMap,
  Method extends keyof RoutesMap[Route]
>(
  request: VrameworkRequest<RouteHandlerOf<Route, Method>['input']>,
  response: VrameworkResponse,
  services: CoreSingletonServices,
  createSessionServices: CreateSessionServices,
  route: { route: Route; method: Method }
): Promise<RouteHandlerOf<Route, Method>['output']> => {
  return runRoute(request, response, services, createSessionServices, route as any)
};
`
}

function generateRoutes(routesMeta: RoutesMeta): string {
  // Initialize an object to collect routes
  const routesObj: Record<
    string,
    Record<string, { input: string; output: string; inputType: string; outputType: string }>
  > = {};

  for (const meta of routesMeta) {
    const { route, method, input, output } = meta;

    // Initialize the route entry if it doesn't exist
    if (!routesObj[route]) {
      routesObj[route] = {};
    }

    // Prepare input and output strings
    const inputStr = input ? `{} as ${input}` : 'null as null';
    const outputStr = output ? `{} as ${output}` : 'null as null';

    // Store the input and output types separately for RouteHandler
    const inputType = input ? input : 'null';
    const outputType = output ? output : 'null';

    // Add method entry
    routesObj[route][method] = {
      input: inputStr,
      output: outputStr,
      inputType,
      outputType,
    };
  }

  // Build the routes object as a string
  let routesStr = 'const routes = {\n';

  for (const [routePath, methods] of Object.entries(routesObj)) {
    routesStr += `  '${routePath}': {\n`;
    for (const [method, handler] of Object.entries(methods)) {
      routesStr += `    ${method}: { input: ${handler.input}, output: ${handler.output} } as RouteHandler<${handler.inputType}, ${handler.outputType}>,\n`;
    }
    routesStr += '  },\n';
  }

  routesStr += '} as const;\n';

  return routesStr;
}