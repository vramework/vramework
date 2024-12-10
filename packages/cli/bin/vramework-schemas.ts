import { Command } from 'commander'
import { saveSchemas, generateSchemas } from '../src/schema/schema-generator.js'

import { inspectorGlob } from '../src/inspector/inspector-glob.js'
import {
  getVrameworkCLIConfig,
  VrameworkCLIConfig,
} from '../src/vramework-cli-config.js'
import { VisitState } from '../src/inspector/visit.js'
import { logCommandInfoAndTime, logVrameworkLogo } from '../src/utils.js'

export const vrameworkSchemas = async (
  { tsconfig, schemaDirectory, supportsImportAttributes }: VrameworkCLIConfig,
  { http }: VisitState
) => {
  return await logCommandInfoAndTime(
    'Creating schemas',
    'Created schemas',
    [false],
    async () => {
      const schemas = await generateSchemas(tsconfig, http.meta, http.customAliasedTypes)
      await saveSchemas(schemaDirectory, schemas, http.meta, http.customAliasedTypes, supportsImportAttributes)
    }
  )
}

async function action({ config }: { config?: string }): Promise<void> {
  logVrameworkLogo()

  const cliConfig = await getVrameworkCLIConfig(config, [
    'routeDirectories',
    'schemaDirectory',
    'tsconfig',
  ])
  const visitState = await inspectorGlob(
    cliConfig.rootDir,
    cliConfig.routeDirectories
  )
  await vrameworkSchemas(cliConfig, visitState)
}

export const schemas = (program: Command): void => {
  program
    .command('schemas')
    .description('Generate schemas for all the expected function input types')
    .option('-c | --config <string>', 'The path to vramework cli config file')
    .action(action)
}
