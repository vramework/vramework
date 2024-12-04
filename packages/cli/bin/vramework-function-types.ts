import { Command } from 'commander'
import {
  getVrameworkCLIConfig,
  VrameworkCLIConfig,
} from '../src/vramework-cli-config.js'
import { VisitState } from '../src/inspector/visit.js'
import { inspectorGlob } from '../src/inspector/inspector-glob.js'
import {
  getFileImportRelativePath,
  getVrameworkFilesAndMethods,
  logCommandInfoAndTime,
  logVrameworkLogo,
  VrameworkCLIOptions,
  writeFileInDir,
} from '../src/utils.js'
import { serializeVrameworkTypes } from '../src/core/serialize-vramework-types.js'
import { vrameworkRoutes } from './vramework-routes.js'

export const vrameworkFunctionTypes = async (
  { typesDeclarationFile: typesFile, packageMappings }: VrameworkCLIConfig,
  options: VrameworkCLIOptions,
  visitState: VisitState
) => {
  await logCommandInfoAndTime(
    'Creating api types',
    'Created api types',
    [false],
    async () => {
      const { userSessionType, sessionServicesType } =
        await getVrameworkFilesAndMethods(
          visitState,
          packageMappings,
          typesFile,
          options,
          { userSessionType: true, sessionServiceType: true }
        )
      const content = serializeVrameworkTypes(
        `import type { ${userSessionType.type} } from '${getFileImportRelativePath(typesFile, userSessionType.typePath, packageMappings)}'`,
        userSessionType.type,
        `import type { ${sessionServicesType.type} } from '${getFileImportRelativePath(typesFile, sessionServicesType.typePath, packageMappings)}'`,
        sessionServicesType.type
      )
      await writeFileInDir(typesFile, content)
    }
  )
}

async function action(cliOptions: VrameworkCLIOptions): Promise<void> {
  logVrameworkLogo()

  const cliConfig = await getVrameworkCLIConfig(cliOptions.config, [
    'rootDir',
    'routeDirectories',
    'typesDeclarationFile',
  ])

  const visitState = await inspectorGlob(
    cliConfig.rootDir,
    cliConfig.routeDirectories
  )
  await vrameworkRoutes(cliConfig, visitState)
}

export const functionTypes = (program: Command): void => {
  program
    .command('types')
    .description('Generate the core API')
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
