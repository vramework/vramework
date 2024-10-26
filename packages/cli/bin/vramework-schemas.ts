import { Command } from 'commander'
import { generateSchemas } from '../src/schema-generator.js'

import { inspectorGlob } from '../src/inspector/inspector-glob.js'
import { getVrameworkCLIConfig, VrameworkCLIConfig } from '../src/vramework-cli-config.js'
import { VisitState } from '../src/inspector/visit.js'
import { logCommandInfoAndTime, logVrameworkLogo } from '../src/utils.js'

export const vrameworkSchemas = async ({ tsconfig, schemaDirectory }: VrameworkCLIConfig, { routesMeta }: VisitState) => {
  await logCommandInfoAndTime('Creating schemas', 'Created schemas', async () => {
    await generateSchemas(
      tsconfig,
      schemaDirectory,
      routesMeta
    )
  })
}

async function action({ configFile }: { configFile?: string }): Promise<void> {
  logVrameworkLogo()
  
  const cliConfig = await getVrameworkCLIConfig(configFile, ['rootDir', 'routesFile', 'schemaDirectory', 'tsconfig'])
  const visitState = await inspectorGlob(cliConfig.rootDir, cliConfig.routeDirectories)
  await vrameworkSchemas(cliConfig, visitState)
}

export const schemas = (program: Command): void => {
  program
    .command('schemas')
    .description('Generate schemas for all the expected function input types')
    .option('-c | --config <string>', 'The path to vramework cli config file')
    .action(action)
}
