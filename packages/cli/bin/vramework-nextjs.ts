import { Command } from 'commander'
import * as path from 'path'
import { serializeNextJsWrapper } from '../src/serializer/serialize-nextjs-wrapper.js'
import {
  getFileImportRelativePath,
  getVrameworkFilesAndMethods,
  logCommandInfoAndTime,
  logVrameworkLogo,
  VrameworkCLIOptions,
  writeFileInDir,
} from '../src/utils.js'
import { getVrameworkCLIConfig, validateCLIConfig, VrameworkCLIConfig } from '../src/vramework-cli-config.js'
import { VisitState } from '../src/inspector/visit.js'
import { inspectorGlob } from '../src/inspector/inspector-glob.js'

export const vrameworkNext = async ({ configDir, vrameworkNextFile, rootDir, routesFile, schemaDirectory, packageMappings }: VrameworkCLIConfig, visitState: VisitState, options: VrameworkCLIOptions) => {
  await logCommandInfoAndTime('Generating nextjs wrapper', 'Generated nextjs wrapper', async () => {
    if (!vrameworkNextFile) {
      throw new Error('vrameworkNextFile is required in vramework config')
    }

    const nextOutputFile = path.join(configDir, vrameworkNextFile)

    const {
      vrameworkConfig,
      singletonServicesFactory,
      sessionServicesFactory
    } = await getVrameworkFilesAndMethods(
      visitState,
      packageMappings,
      nextOutputFile,
      options
    )

    const vrameworkConfigImport = `import { ${vrameworkConfig.variable} as config } from '${getFileImportRelativePath(nextOutputFile, vrameworkConfig.file, packageMappings)}'`
    const singletonServicesImport = `import { ${singletonServicesFactory.variable} as createSingletonServices } from '${getFileImportRelativePath(nextOutputFile, singletonServicesFactory.file, packageMappings)}'`
    const sessionServicesImport = `import { ${sessionServicesFactory.variable} as createSessionServices } from '${getFileImportRelativePath(nextOutputFile, sessionServicesFactory.file, packageMappings)}'`

    const routesPath = getFileImportRelativePath(
      path.join(configDir, vrameworkNextFile),
      path.join(rootDir, routesFile),
      packageMappings
    )
    const schemasPath = getFileImportRelativePath(
      path.join(configDir, vrameworkNextFile),
      path.join(rootDir, schemaDirectory, 'schemas.ts'),
      packageMappings
    )

    const content = serializeNextJsWrapper(
      routesPath,
      schemasPath,
      vrameworkConfigImport,
      singletonServicesImport,
      sessionServicesImport
    )
    await writeFileInDir(nextOutputFile, content)
  })
}

export const action = async (
  options: VrameworkCLIOptions
): Promise<void> => {
  logVrameworkLogo()

  const cliConfig = await getVrameworkCLIConfig(options.config, true)
  validateCLIConfig(cliConfig, ['rootDir', 'schemaDirectory', 'configDir', 'vrameworkNextFile'])

  const visitState = await inspectorGlob(cliConfig.rootDir, cliConfig.routeDirectories)
  await vrameworkNext(cliConfig, visitState, options)
}

export const nextjs = (program: Command): void => {
  program
    .command('nextjs')
    .description('generate nextjs wrapper')
    .option(
      '-ct | --vramework-config-type',
      'The type of your vramework config object'
    )
    .option(
      '-ss | --singleton-services-factory-type',
      'The type of your singleton services factory'
    )
    .option(
      '-se | --session-services-factory-type',
      'The type of your session services factory'
    )
    .option('-c | --config <string>', 'The path to vramework cli config file')
    .action(action)
}
