import { Command } from 'commander'
import { generateSchemas } from '../src/schema-generator'

import { join } from 'path'
import { getVrameworkConfig } from '@vramework/core/vramework-config'
import { getRoutes } from '@vramework/core/route-runner'

const importFile = async (path: string) => {
  return await import(path)
}

async function action({ configFile }: { configFile?: string }): Promise<void> {
  const { schemaOutputDirectory, tsconfig, rootDir, routesOutputFile } =
    await getVrameworkConfig(configFile)

  if (!rootDir || !routesOutputFile || !schemaOutputDirectory || !tsconfig) {
    console.error(
      'rootDir, routesOutputFile, tsconfig file and schema directory are required in vramework.config.json'
    )
    process.exit(1)
  }

  const startedAt = Date.now()
  console.log(`
Generating schemas:
    - TSConfig:\n\t${tsconfig}
    - Output Directory:\n\t${schemaOutputDirectory}
    - Route Meta:\n\t${routesOutputFile}
`)

  try {
    await importFile(join(rootDir, routesOutputFile))
  } catch (e) {
    console.error(e)
    console.error('Error loading routes meta, has it been generated?')
    return
  }

  await generateSchemas(
    join(rootDir, tsconfig),
    join(rootDir, schemaOutputDirectory),
    getRoutes().routesMeta
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
