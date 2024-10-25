import { Command } from 'commander'
import { generateSchemas } from '../src/schema-generator.js'

import { join } from 'path'
import { extractVrameworkInformation } from '../src/extract-vramework-information.js'
import { getVrameworkCLIConfig } from '../src/vramework-cli-config.js'

async function action({ configFile }: { configFile?: string }): Promise<void> {
  const { schemaOutputDirectory, routeDirectories, tsconfig, rootDir, routesOutputFile } = await getVrameworkCLIConfig(configFile)

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

  const { routesMeta } = await extractVrameworkInformation(rootDir, routeDirectories)

  await generateSchemas(
    join(rootDir, tsconfig),
    join(rootDir, schemaOutputDirectory),
    routesMeta
  )

  console.log(`Schemas generated in ${Date.now() - startedAt}ms.`)
}

export const schemas = (program: Command): void => {
  program
    .command('schemas')
    .description('generate schemas')
    .option('-c | --config <string>', 'The path to vramework cli config file')
    .action(action)
}
