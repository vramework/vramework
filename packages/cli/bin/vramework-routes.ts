import { Command } from 'commander'
import {
  getVrameworkCLIConfig,
  VrameworkCLIConfig,
} from '../src/vramework-cli-config.js'
import { serializeHTTPRoutesMeta } from '../src/http/serialize-route-meta.js'
import { VisitState } from '../src/inspector/visit.js'
import { inspectorGlob } from '../src/inspector/inspector-glob.js'
import {
  logCommandInfoAndTime,
  logVrameworkLogo,
  VrameworkCLIOptions,
  writeFileInDir,
} from '../src/utils.js'
import { serializeRoutes } from '../src/http/serialize-routes.js'

export const vrameworkRoutes = async (
  cliConfig: VrameworkCLIConfig,
  visitState: VisitState
) => {
  return await logCommandInfoAndTime(
    'Finding routes',
    'Found routes',
    [visitState.http.files.size === 0],
    async () => {
      const { routesFile, packageMappings } = cliConfig
      const { http } = visitState
      const content = [
        serializeRoutes(routesFile, http.files, packageMappings),
        serializeHTTPRoutesMeta(http.meta),
      ]
      await writeFileInDir(routesFile, content.join('\n\n'))
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
  await vrameworkRoutes(cliConfig, visitState)
}

export const routes = (program: Command): void => {
  program
    .command('routes')
    .description('Find all routes to import')
    .option('-c | --config <string>', 'The path to vramework cli config file')
    .action(action)
}
