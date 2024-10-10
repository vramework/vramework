import { Command } from 'commander'
import { getVrameworkConfig } from '@vramework/core/vramework-config'
import { inspectRoutes } from '../src/inspect-routes'
import * as promises from 'fs/promises'
import path = require('path')
import { serailizeTypedRouteRunner, serializeRouteMeta, serializeRoutes } from '../src/routes-serializers'
import { glob } from 'glob'

async function action({ configFile }: { configFile?: string }): Promise<void> {
  let { routeDirectories, routesOutputFile, rootDir, packageMappings  } =
    await getVrameworkConfig(configFile)

  if (
    !rootDir ||
    !routeDirectories ||
    !routesOutputFile
  ) {
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

  const routeFiles = (await Promise.all(routeDirectories.map((dir) => glob(`${path.join(rootDir, dir)}/**/*.ts`)))).flat()
  const outputPath = path.join(rootDir, routesOutputFile)

  const { routesMeta, typesImportMap, filesWithRoutes } = await inspectRoutes(outputPath, routeFiles, packageMappings)

  const parts = outputPath.split('/')
  parts.pop()
  await promises.mkdir(parts.join('/'), { recursive: true })
  const content = [
    serializeRoutes(outputPath, filesWithRoutes, packageMappings),
    // serializeInterface(typesImportMap, routesMeta),
    serializeRouteMeta(routesMeta),
    serailizeTypedRouteRunner(typesImportMap, routesMeta)
  ]
  await promises.writeFile(outputPath, content.join('\n\n'), 'utf-8')

  console.log(`Routes generated in ${Date.now() - startedAt}ms.`)
}

export const routes = (program: Command): void => {
  program
    .command('routes')
    .description('generate routes')
    .option('-c | --config-file <string>', 'The path to vramework config file')
    .action(action)
}
