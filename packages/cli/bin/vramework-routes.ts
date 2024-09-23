import { Command } from 'commander'
import { getVrameworkConfig } from '@vramework/core/vramework-config'
import { generateRoutesImports } from '../src/routes-generator'
import { generateRouteMeta } from '../src/generate-route-meta'

async function action({ configFile }: { configFile?: string }): Promise<void> {
  const { vrameworkTypesModule, routeDirectories, routesOutputFile, rootDir } =
    await getVrameworkConfig(configFile)

  if (
    !vrameworkTypesModule ||
    !rootDir ||
    !routeDirectories ||
    !routesOutputFile
  ) {
    console.error(
      'vrameworkTypesModule, rootDir, routeDirectories and routesOutputFile are required in vramework.config.json'
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

  console.log('Generating schema mappings...', outputPath)
  await generateRouteMeta([outputPath])

  console.log(`Routes generated in ${Date.now() - startedAt}ms.`)
}

export const routes = (program: Command): void => {
  program
    .command('routes')
    .description('generate routes')
    .option('-c | --config-file <string>', 'The path to vramework config file')
    .action(action)
}
