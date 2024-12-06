import { ChannelsMeta } from '@vramework/core'
import { ImportMap } from '../inspector/inspector.js'
import { serializeImportMap } from '../core/serialize-import-map.js'

export const serializeTypedChannelsMap = (
  relativeToPath: string,
  packageMappings: Record<string, string>,
  importMap: ImportMap,
  channelsMeta: ChannelsMeta,
  metaTypes: Map<string, string>
): string => {
  return `/**
 * This provides the structure needed for TypeScript to be aware of channels
 */
    
${serializeImportMap(relativeToPath, packageMappings, importMap)}

// The '& {}' is a workaround for not directly referring to a type since it confuses TypeScript
${Array.from(metaTypes.entries())
  .map(([name, schema]) => `export type ${name} = ${schema} & {}`)
  .join('\n')}

interface ChannelHandler<I, O> {
    input: I;
    output: O;
}

${generateChannels(channelsMeta)}

export type ChannelDefaultHandlerOf<Channel extends keyof ChannelsMap> =
    ChannelsMap[Channel]['defaultMessage'] extends { input: infer I; output: infer O }
        ? ChannelHandler<I, O>
        : never;

export type ChannelRouteHandlerOf<
    Channel extends keyof ChannelsMap, 
    Route extends keyof ChannelsMap[Channel]['routes'], 
    Method extends keyof ChannelsMap[Channel]['routes'][Route],
> =
    ChannelsMap[Channel]['routes'][Route][Method] extends { input: infer I; output: infer O }
        ? ChannelHandler<I, O>
        : never;
`
}

function generateChannels(channelsMeta: ChannelsMeta): string {
  const channelsObject: Record<
    string,
    {
      message: { inputs: string[] | null; outputs: string[] | null } | null
      routes: Record<
        string,
        Record<
          string,
          {
            inputTypes: string[] | null
            outputTypes: string[] | null
          }
        >
      >
    }
  > = {}

  for (const meta of channelsMeta) {
    const { channel, messageRoutes, message } = meta

    if (!channelsObject[channel]) {
      channelsObject[channel] = { message, routes: {} }
    }

    for (const [key, route] of Object.entries(messageRoutes)) {
      if (!channelsObject[channel].routes[key]) {
        channelsObject[channel].routes[key] = {}
      }
      for (const [method, { inputs, outputs }] of Object.entries(route)) {
        channelsObject[channel].routes[key][method] = {
          inputTypes: inputs || null,
          outputTypes: outputs || null,
        }
      }
    }
  }

  let routesStr = 'export type ChannelsMap = {\n'

  for (const [channelPath, { routes, message }] of Object.entries(
    channelsObject
  )) {
    routesStr += `  readonly '${channelPath}': {\n`

    // Add `routes` object
    routesStr += `    readonly routes: {\n`
    for (const [key, methods] of Object.entries(routes)) {
      routesStr += `      readonly ${key}: {\n`
      for (const [method, handler] of Object.entries(methods)) {
        routesStr += `        readonly ${method}: ChannelHandler<${formatTypeArray(
          handler.inputTypes
        )}, ${formatTypeArray(handler.outputTypes)}>,\n`
      }
      routesStr += '      },\n'
    }
    routesStr += '    },\n'

    // Add `defaultMessage` outside `routes`
    if (message) {
      routesStr += `    readonly defaultMessage: ChannelHandler<${formatTypeArray(
        message.inputs
      )}, ${formatTypeArray(message.outputs)}>,\n`
    }

    routesStr += '  },\n'
  }

  routesStr += '};'

  return routesStr
}

// Utility to format type arrays
function formatTypeArray(types: string[] | null): string {
  return types ? types.join(' | ') : 'null'
}
