import { Command } from 'commander'
import { getVrameworkCLIConfig, VrameworkCLIConfig } from '../src/vramework-cli-config.js'
import { VisitState } from '../src/inspector/visit.js'
import { inspectorGlob } from '../src/inspector/inspector-glob.js'
import { logCommandInfoAndTime, logVrameworkLogo, VrameworkCLIOptions, writeFileInDir } from '../src/utils.js'
import { serializeTypedRoutesMap } from '../src/serializer/serialize-typed-route-map.js'

export const vrameworkRoutesMap = async ({ routesMapDeclarationFile, packageMappings }: VrameworkCLIConfig, visitState: VisitState) => {
  return await logCommandInfoAndTime('Creating routes map', 'Created routes map', async () => {
    const content = serializeTypedRoutesMap(routesMapDeclarationFile, packageMappings, visitState.functionTypesImportMap, visitState.routesMeta)
    await writeFileInDir(routesMapDeclarationFile, content)
  })
}

async function action(cliOptions: VrameworkCLIOptions): Promise<void> {
  logVrameworkLogo()
  const cliConfig = await getVrameworkCLIConfig(cliOptions.config, ['rootDir', 'routeDirectories', 'routesFile'])
  const visitState = await inspectorGlob(cliConfig.rootDir, cliConfig.routeDirectories)
  await vrameworkRoutesMap(cliConfig, visitState)
}

export const routesMap = (program: Command): void => {
  program
    .command('map')
    .description('Generate a map of all routes to aid in type checking')
    .option('-c | --config <string>', 'The path to vramework cli config file')
    .action(action)
}
