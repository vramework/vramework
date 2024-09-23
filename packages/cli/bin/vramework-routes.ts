import { Command } from 'commander'
import { getVrameworkConfig } from '@vramework/core/vramework-config'
import { loadRoutes } from '@vramework/core/api-routes'
import { serializeRoutes } from '../src/routes-generator'
import { generateRouteMeta } from '../src/generate-route-meta'
import * as promises from 'fs/promises'
import path = require('path')

async function action({ configFile }: { configFile?: string }): Promise<void> {
  let { routeDirectories, routesOutputFile, rootDir } =
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

  const routeFiles = await loadRoutes(rootDir,routeDirectories)
  const { routesMeta, routesInterface } = await generateRouteMeta(routesOutputFile, routeFiles)

  const outputPath = path.join(rootDir, routesOutputFile)
  const parts = outputPath.split('/')
  parts.pop()
  await promises.mkdir(parts.join('/'), { recursive: true })
  const content = `
${serializeRoutes(outputPath, routeFiles)}

${routesInterface}

import { addRouteMeta } from '@vramework/core/route-runner'
addRouteMeta(${JSON.stringify(routesMeta)})
`
  await promises.writeFile(outputPath, content, 'utf-8')

  console.log(`Routes generated in ${Date.now() - startedAt}ms.`)
}

export const routes = (program: Command): void => {
  program
    .command('routes')
    .description('generate routes')
    .option('-c | --config-file <string>', 'The path to vramework config file')
    .action(action)
}
