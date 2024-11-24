import { Command } from 'commander'
import { serializeNextJsWrapper } from '../src/nextjs/serialize-nextjs-wrapper.js'
import {
  getFileImportRelativePath,
  getVrameworkFilesAndMethods,
  logCommandInfoAndTime,
  logVrameworkLogo,
  VrameworkCLIOptions,
  writeFileInDir,
} from '../src/utils.js'
import {
  getVrameworkCLIConfig,
  VrameworkCLIConfig,
} from '../src/vramework-cli-config.js'
import { VisitState } from '../src/inspector/visit.js'
import { inspectorGlob } from '../src/inspector/inspector-glob.js'

export const vrameworkNext = async (
  {
    nextJSfile,
    routesFile,
    routesMapDeclarationFile,
    schemaDirectory,
    packageMappings,
  }: VrameworkCLIConfig,
  visitState: VisitState,
  options: VrameworkCLIOptions
) => {
  await logCommandInfoAndTime(
    'Generating nextjs wrapper',
    'Generated nextjs wrapper',
    async () => {
      if (!nextJSfile) {
        throw new Error('nextJSfile is required in vramework config')
      }

      const {
        vrameworkConfig,
        singletonServicesFactory,
        sessionServicesFactory,
      } = await getVrameworkFilesAndMethods(
        visitState,
        packageMappings,
        nextJSfile,
        options
      )

      const vrameworkConfigImport = `import { ${vrameworkConfig.variable} as createConfig } from '${getFileImportRelativePath(nextJSfile, vrameworkConfig.file, packageMappings)}'`
      const singletonServicesImport = `import { ${singletonServicesFactory.variable} as createSingletonServices } from '${getFileImportRelativePath(nextJSfile, singletonServicesFactory.file, packageMappings)}'`
      const sessionServicesImport = `import { ${sessionServicesFactory.variable} as createSessionServices } from '${getFileImportRelativePath(nextJSfile, sessionServicesFactory.file, packageMappings)}'`

      const routesPath = getFileImportRelativePath(
        nextJSfile,
        routesFile,
        packageMappings
      )
      const routesMapDeclarationPath = getFileImportRelativePath(
        nextJSfile,
        routesMapDeclarationFile,
        packageMappings
      )
      const schemasPath = getFileImportRelativePath(
        nextJSfile,
        `${schemaDirectory}/register.ts`,
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
      await writeFileInDir(nextJSfile, content)
    }
  )
}

export const action = async (options: VrameworkCLIOptions): Promise<void> => {
  logVrameworkLogo()
  const cliConfig = await getVrameworkCLIConfig(
    options.config,
    ['rootDir', 'schemaDirectory', 'configDir', 'nextJSfile'],
    true
  )
  const visitState = await inspectorGlob(
    cliConfig.rootDir,
    cliConfig.routeDirectories
  )
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
