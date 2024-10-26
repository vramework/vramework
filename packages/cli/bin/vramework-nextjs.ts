import { Command } from 'commander'
import { serializeNextJsWrapper } from '../src/serializer/serialize-nextjs-wrapper.js'
import {
  getFileImportRelativePath,
  getVrameworkFilesAndMethods,
  logCommandInfoAndTime,
  logVrameworkLogo,
  VrameworkCLIOptions,
  writeFileInDir,
} from '../src/utils.js'
import { getVrameworkCLIConfig, VrameworkCLIConfig } from '../src/vramework-cli-config.js'
import { VisitState } from '../src/inspector/visit.js'
import { inspectorGlob } from '../src/inspector/inspector-glob.js'

export const vrameworkNext = async ({ nextDeclarationFile, routesFile, routesMapDeclarationFile, schemaDirectory, packageMappings }: VrameworkCLIConfig, visitState: VisitState, options: VrameworkCLIOptions) => {
  await logCommandInfoAndTime('Generating nextjs wrapper', 'Generated nextjs wrapper', async () => {
    if (!nextDeclarationFile) {
      throw new Error('vrameworkNextFile is required in vramework config')
    }

    const {
      vrameworkConfig,
      singletonServicesFactory,
      sessionServicesFactory
    } = await getVrameworkFilesAndMethods(
      visitState,
      packageMappings,
      nextDeclarationFile,
      options
    )

    const vrameworkConfigImport = `import { ${vrameworkConfig.variable} as config } from '${getFileImportRelativePath(nextDeclarationFile, vrameworkConfig.file, packageMappings)}'`
    const singletonServicesImport = `import { ${singletonServicesFactory.variable} as createSingletonServices } from '${getFileImportRelativePath(nextDeclarationFile, singletonServicesFactory.file, packageMappings)}'`
    const sessionServicesImport = `import { ${sessionServicesFactory.variable} as createSessionServices } from '${getFileImportRelativePath(nextDeclarationFile, sessionServicesFactory.file, packageMappings)}'`

    const routesPath = getFileImportRelativePath(
      nextDeclarationFile,
      routesFile,
      packageMappings
    )
    const routesMapDeclarationPath = getFileImportRelativePath(
      nextDeclarationFile,
      routesMapDeclarationFile,
      packageMappings
    )
    const schemasPath = getFileImportRelativePath(
      nextDeclarationFile,
      `${schemaDirectory}/schemas.ts`,
      packageMappings
    )

    const content = serializeNextJsWrapper(
      routesPath,
      routesMapDeclarationPath,
      schemasPath,
      vrameworkConfigImport,
      singletonServicesImport,
      sessionServicesImport
    )
    await writeFileInDir(nextDeclarationFile, content)
  })
}

export const action = async (
  options: VrameworkCLIOptions
): Promise<void> => {
  logVrameworkLogo()
  const cliConfig = await getVrameworkCLIConfig(options.config, ['rootDir', 'schemaDirectory', 'configDir', 'nextDeclarationFile'], true)
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
