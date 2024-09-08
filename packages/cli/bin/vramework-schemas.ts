import { Command } from 'commander'
import { generateSchemas } from '../src/schema-generator'
import { loadAPIFiles } from '@vramework/core/api-routes'
import { getVrameworkConfig } from '@vramework/core/vramework-config'

async function action({ configFile }: { configFile?: string }): Promise<void> {
  const { routeDirectories, schemaOutputDirectory, tsconfig } = await getVrameworkConfig(configFile)

  if (!routeDirectories || !schemaOutputDirectory || !tsconfig) { 
    console.error('routeDirectories, tsconfig file and schema directory are required')
    process.exit(1)
  }
  
  const apiRoutes = await loadAPIFiles(routeDirectories)

  await generateSchemas(
    tsconfig,
    schemaOutputDirectory,
    apiRoutes
  )
}

export const schemas = (program: Command): void => {
  program
    .command('schemas')
    .description('generate schemas')
    .option('-c | --config-file <string>', 'The path to vramework config file')
    .action(action)
}