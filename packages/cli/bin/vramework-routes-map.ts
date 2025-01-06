import { Command } from 'commander'
import {
  getVrameworkCLIConfig,
  VrameworkCLIConfig,
} from '../src/vramework-cli-config.js'
import { InspectorState } from '@vramework/inspector'
import {
  logCommandInfoAndTime,
  logVrameworkLogo,
  VrameworkCLIOptions,
  writeFileInDir,
} from '../src/utils.js'
import { serializeTypedRoutesMap } from '../src/http/serialize-typed-route-map.js'
import { inspectorGlob } from '../src/inspector-glob.js'

export const vrameworkHTTPMap = async (
  { routesMapDeclarationFile, packageMappings }: VrameworkCLIConfig,
  { http }: InspectorState
) => {
  return await logCommandInfoAndTime(
    'Creating routes map',
    'Created routes map',
    [http.files.size === 0],
    async () => {
      const content = serializeTypedRoutesMap(
        routesMapDeclarationFile,
        packageMappings,
        http.typesMap,
        http.meta,
        http.metaInputTypes,
      )
      await writeFileInDir(routesMapDeclarationFile, content)
    }
  )
}

async function action(cliOptions: VrameworkCLIOptions): Promise<void> {
  logVrameworkLogo()
  const cliConfig = await getVrameworkCLIConfig(cliOptions.config, [
    'rootDir',
    'routeDirectories',
    'routesFile',
  ])
  const visitState = await inspectorGlob(
    cliConfig.rootDir,
    cliConfig.routeDirectories
  )
  await vrameworkHTTPMap(cliConfig, visitState)
}

export const routesMap = (program: Command): void => {
  program
    .command('map')
    .description('Generate a map of all routes to aid in type checking')
    .option('-c | --config <string>', 'The path to vramework cli config file')
    .action(action)
}
