import { Command } from 'commander'
import { generateSchemas } from '../src/schema-generator.js'

import { join } from 'path'
import { inspectorGlob } from '../src/inspector/inspector-glob.js'
import { getVrameworkCLIConfig, validateCLIConfig, VrameworkCLIConfig } from '../src/vramework-cli-config.js'
import { VisitState } from '../src/inspector/visit.js'
import { logCommandInfoAndTime, logVrameworkLogo } from '../src/utils.js'

export const vrameworkSchemas = async ({ rootDir, tsconfig, schemaDirectory }: VrameworkCLIConfig, { routesMeta }: VisitState) => {
  await logCommandInfoAndTime('Creating schemas', 'Created schemas', async () => {
    await generateSchemas(
      join(rootDir, tsconfig),
      join(rootDir, schemaDirectory),
      routesMeta
    )
  })
}

async function action({ configFile }: { configFile?: string }): Promise<void> {
  logVrameworkLogo()
  
  const cliConfig = await getVrameworkCLIConfig(configFile)
  validateCLIConfig(cliConfig, ['rootDir', 'routesFile', 'schemaDirectory', 'tsconfig'])

  const startedAt = Date.now()
  const visitState = await inspectorGlob(cliConfig.rootDir, cliConfig.routeDirectories)
  await vrameworkSchemas(cliConfig, visitState)

  console.log(`Schemas generated in ${Date.now() - startedAt}ms.`)
}

export const schemas = (program: Command): void => {
  program
    .command('schemas')
    .description('generate schemas')
    .option('-c | --config <string>', 'The path to vramework cli config file')
    .action(action)
}
