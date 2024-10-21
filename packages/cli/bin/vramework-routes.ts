import { Command } from 'commander'
import { getVrameworkCLIConfig } from '@vramework/core/vramework-cli-config'
import * as promises from 'fs/promises'
import {
  serializeRouteMeta,
  serializeRoutes,
  serializeTypedRouteRunner,
} from '../src/routes-serializers'
import { extractVrameworkInformation } from '../src/extract-vramework-information'

async function action({ configFile }: { configFile?: string }): Promise<void> {
  let cliConfig = await getVrameworkCLIConfig(configFile)
  const { rootDir, routeDirectories, routesOutputFile } = cliConfig

  if (!rootDir || !routeDirectories || !routesOutputFile) {
    console.error(
      'rootDir, routeDirectories and routesOutputFile are required in vramework.config.json'
    )
    process.exit(1)
  }

  const startedAt = Date.now()
  console.log(`
Generating Route File:
    - Route Directories: ${['', ...routeDirectories].join('\n\t- ')}
    - Route Output:\n\t${routesOutputFile}
`)

  const { routesMeta, typesImportMap, filesWithRoutes, routesOutputPath } =
    await extractVrameworkInformation(cliConfig)

  const parts = routesOutputPath.split('/')
  parts.pop()
  await promises.mkdir(parts.join('/'), { recursive: true })
  const content = [
    serializeRoutes(
      routesOutputPath,
      filesWithRoutes,
      cliConfig.packageMappings
    ),
    // serializeInterface(typesImportMap, routesMeta),
    serializeRouteMeta(routesMeta),
    serializeTypedRouteRunner(typesImportMap, routesMeta),
  ]
  await promises.writeFile(routesOutputPath, content.join('\n\n'), 'utf-8')

  console.log(`Routes generated in ${Date.now() - startedAt}ms.`)
}

export const routes = (program: Command): void => {
  program
    .command('routes')
    .description('generate routes')
    .option('-c | --config <string>', 'The path to vramework cli config file')
    .action(action)
}
