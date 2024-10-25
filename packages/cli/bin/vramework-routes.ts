import { Command } from 'commander'
import * as promises from 'fs/promises'
import {
  serializeRouteMeta,
  serializeRoutes,
  serializeTypedRouteRunner,
  serializeTypedRoutesMap,
} from '../src/routes-serializers.js'
import { extractVrameworkInformation } from '../src/extract-vramework-information.js'
import { join } from 'path'
import { getVrameworkCLIConfig } from '../src/vramework-cli-config.js'

async function action({ configFile }: { configFile?: string }): Promise<void> {
  let { rootDir, routeDirectories, routesOutputFile, routesMapOutputFile, packageMappings = {} } = await getVrameworkCLIConfig(configFile)

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
    - Route Mapping Output:\n\t${routesMapOutputFile ? routesMapOutputFile : 'Not provided'}
`)

  const { routesMeta, typesImportMap, filesWithRoutes } = await extractVrameworkInformation(rootDir, routeDirectories)

  routesOutputFile = join(rootDir, routesOutputFile)
  const parts = routesOutputFile.split('/')
  parts.pop()
  await promises.mkdir(parts.join('/'), { recursive: true })
  const content = [
    serializeRoutes(
      routesOutputFile,
      filesWithRoutes,
      packageMappings
    ),
    // serializeInterface(typesImportMap, routesMeta),
    serializeRouteMeta(routesMeta),
    serializeTypedRoutesMap(routesOutputFile, packageMappings, typesImportMap, routesMeta),
    serializeTypedRouteRunner(),
  ]
  await promises.writeFile(routesOutputFile, content.join('\n\n'), 'utf-8')

  if (routesMapOutputFile) {
    routesMapOutputFile = join(rootDir, routesMapOutputFile)
    const parts = routesMapOutputFile.split('/')
    parts.pop()
    await promises.mkdir(parts.join('/'), { recursive: true })
    await promises.writeFile(routesMapOutputFile, serializeTypedRoutesMap(routesMapOutputFile, packageMappings, typesImportMap, routesMeta), 'utf-8')
  }

  console.log(`Routes generated in ${Date.now() - startedAt}ms.`)
}

export const routes = (program: Command): void => {
  program
    .command('routes')
    .description('generate routes')
    .option('-c | --config <string>', 'The path to vramework cli config file')
    .action(action)
}
