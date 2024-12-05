import { RoutesMeta } from '@vramework/core'
import { ImportMap } from '../inspector/inspector.js'
import { serializeImportMap } from '../core/serialize-import-map.js'

export const serializeTypedRoutesMap = (
  relativeToPath: string,
  packageMappings: Record<string, string>,
  importMap: ImportMap,
  routesMeta: RoutesMeta,
  metaTypes: Map<string, string>
) => {
  return `/**
 * This provides the structure needed for typescript to be aware of routes and their return types
 */
    
${serializeImportMap(relativeToPath, packageMappings, importMap)}

// The '& {}' is a workaround for not directly refering to a type since it confuses typescript
${Array.from(metaTypes.entries())
  .map(([name, schema]) => `export type ${name} = ${schema} & {}`)
  .join('\n')}

interface RouteHandler<I, O> {
    input: I;
    output: O;
}

${generateRoutes(routesMeta)}

export type RouteHandlerOf<Route extends keyof RoutesMap, Method extends keyof RoutesMap[Route]> =
    RoutesMap[Route][Method] extends { input: infer I; output: infer O }
        ? RouteHandler<I, O>
        : never;
  `
}

function generateRoutes(routesMeta: RoutesMeta): string {
  // Initialize an object to collect routes
  const routesObj: Record<
    string,
    Record<string, { inputType: string; outputType: string }>
  > = {}

  for (const meta of routesMeta) {
    const { route, method, input, output } = meta

    // Initialize the route entry if it doesn't exist
    if (!routesObj[route]) {
      routesObj[route] = {}
    }

    // Store the input and output types separately for RouteHandler
    const inputType = input ? input : 'null'
    const outputType = output ? output : 'null'

    // Add method entry
    routesObj[route][method] = {
      inputType,
      outputType,
    }
  }

  // Build the routes object as a string
  let routesStr = 'export type RoutesMap = {\n'

  for (const [routePath, methods] of Object.entries(routesObj)) {
    routesStr += `  readonly '${routePath}': {\n`
    for (const [method, handler] of Object.entries(methods)) {
      routesStr += `    readonly ${method}: RouteHandler<${handler.inputType}, ${handler.outputType}>,\n`
    }
    routesStr += '  },\n'
  }

  routesStr += '};'

  return routesStr
}
