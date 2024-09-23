import { Command } from 'commander'
import { getVrameworkConfig } from '@vramework/core/vramework-config'
import { generateRoutesImports } from '../src/routes-generator'
import { generateRouteMeta } from '../src/generate-route-meta'
import * as promises from 'fs/promises'
import path = require('path')

async function action({ configFile }: { configFile?: string }): Promise<void> {
  let { routeDirectories, routesOutputFile, routesInterfaceFile, routesMetaFile, rootDir } =
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

  const outputPath = await generateRoutesImports(
    rootDir,
    routeDirectories,
    routesOutputFile
  )

  const { routesMeta, routesInterface } = await generateRouteMeta(routesOutputFile, outputPath)

  if (routesMetaFile) {
    routesMetaFile = path.join(rootDir, routesMetaFile)
    const parts = routesMetaFile.split('/')
    parts.pop()
    await promises.mkdir(parts.join('/'), { recursive: true })
    await promises.writeFile(routesMetaFile, JSON.stringify(routesMeta), 'utf-8')
  }

  if (routesInterfaceFile){
    routesInterfaceFile = path.join(rootDir, routesInterfaceFile)
    const parts = routesInterfaceFile.split('/')
    parts.pop()
    await promises.mkdir(parts.join('/'), { recursive: true })
    await promises.writeFile(routesInterfaceFile, routesInterface, 'utf-8')
  }

  console.log(`Routes generated in ${Date.now() - startedAt}ms.`)
}

export const routes = (program: Command): void => {
  program
    .command('routes')
    .description('generate routes')
    .option('-c | --config-file <string>', 'The path to vramework config file')
    .action(action)
}
