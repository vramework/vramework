import { Command } from 'commander'
import { join } from 'path'
import { getVrameworkCLIConfig, validateCLIConfig, VrameworkCLIConfig } from '../src/vramework-cli-config.js'
import { serializeRoutes } from '../src/serializer/serialize-routes.js'
import { serializeRouteMeta } from '../src/serializer/serialize-route-meta.js'
import { serializeTypedRoutesMap } from '../src/serializer/serialize-typed-route-map.js'
import { serializeTypedRouteRunner } from '../src/serializer/serialize-typed-route-runner.js'
import { VisitState } from '../src/inspector/visit.js'
import { inspectorGlob } from '../src/inspector/inspector-glob.js'
import { logCommandInfoAndTime, logVrameworkLogo, VrameworkCLIOptions, writeFileInDir } from '../src/utils.js'

export const vrameworkRoutes = async ({ rootDir, routesFile, packageMappings }: VrameworkCLIConfig, visitState: VisitState) => {
  return await logCommandInfoAndTime('Finding routes', 'Found routes', async () => {
    const { filesWithRoutes, routesMeta, functionTypesImportMap } = visitState

    routesFile = join(rootDir, routesFile)

    const content = [
      serializeRoutes(
        routesFile,
        filesWithRoutes,
        packageMappings
      ),
      // serializeInterface(functionTypesImportMap, routesMeta),
      serializeRouteMeta(routesMeta),
      serializeTypedRoutesMap(routesFile, packageMappings, functionTypesImportMap, routesMeta),
      serializeTypedRouteRunner(),
    ]

    await writeFileInDir(routesFile, content.join('\n\n'))
  })
}

async function action(cliOptions: VrameworkCLIOptions): Promise<void> {
  logVrameworkLogo()

  const cliConfig = await getVrameworkCLIConfig(cliOptions.config)
  validateCLIConfig(cliConfig, ['rootDir', 'routeDirectories', 'routesFile'])

  const startedAt = Date.now()
  const visitState = await inspectorGlob(cliConfig.rootDir, cliConfig.routeDirectories)
  await vrameworkRoutes(cliConfig, visitState)
  console.log(`Routes generated in ${Date.now() - startedAt}ms.`)
}

export const routes = (program: Command): void => {
  program
    .command('routes')
    .description('generate routes')
    .option('-c | --config <string>', 'The path to vramework cli config file')
    .action(action)
}
