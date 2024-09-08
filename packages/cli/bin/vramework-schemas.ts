import { Command } from 'commander'
import { generateSchemas } from '../src/schema-generator'
import { loadAPIFiles } from '@vramework/core/api-routes'
import { getVrameworkConfig } from '@vramework/core/vramework-config'
import path = require('path')

async function action({ configFile }: { configFile?: string }): Promise<void> {
  const { routeDirectories, schemaOutputDirectory, tsconfig, rootDir } = await getVrameworkConfig(configFile)

  if (!routeDirectories || !schemaOutputDirectory || !tsconfig) { 
    console.error('routeDirectories, tsconfig file and schema directory are required')
    process.exit(1)
  }
  
  await generateSchemas(
    path.join(rootDir, tsconfig),
    path.join(rootDir, schemaOutputDirectory),
    await loadAPIFiles(rootDir, routeDirectories)
  )
}

export const schemas = (program: Command): void => {
  program
    .command('schemas')
    .description('generate schemas')
    .option('-c | --config-file <string>', 'The path to vramework config file')
    .action(action)
}