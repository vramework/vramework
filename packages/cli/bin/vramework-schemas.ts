import { Command } from 'commander'
import { generateSchemas } from '../src/schema-generator'
import { loadAPIFiles } from '@vramework/core/api-routes'
import { getVrameworkConfig } from '@vramework/core/vramework-config'
import path = require('path')

async function action({ configFile }: { configFile?: string }): Promise<void> {
  const { routeDirectories, schemaOutputDirectory, tsconfig, rootDir } =
    await getVrameworkConfig(configFile)

  if (!rootDir || !routeDirectories || !schemaOutputDirectory || !tsconfig) {
    console.error(
      'rootDir, routeDirectories, tsconfig file and schema directory are required in vramework.config.json'
    )
    process.exit(1)
  }

  const startedAt = Date.now()
  console.log(`
Generating schemas:
    - TSConfig:\n\t${tsconfig}
    - Output Directory:\n\t${schemaOutputDirectory}
    - Route Directories:${['', ...routeDirectories].join('\n\t- ')}
`)

  await generateSchemas(
    path.join(rootDir, tsconfig),
    path.join(rootDir, schemaOutputDirectory),
    await loadAPIFiles(rootDir, routeDirectories)
  )

  console.log(`Schemas generated in ${Date.now() - startedAt}ms.`)
}

export const schemas = (program: Command): void => {
  program
    .command('schemas')
    .description('generate schemas')
    .option('-c | --config-file <string>', 'The path to vramework config file')
    .action(action)
}
