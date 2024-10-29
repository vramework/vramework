import { Command } from 'commander'
import {
  getFileImportRelativePath,
  logCommandInfoAndTime,
  logVrameworkLogo,
  VrameworkCLIOptions,
  writeFileInDir,
} from '../src/utils.js'
import { getVrameworkCLIConfig, VrameworkCLIConfig } from '../src/vramework-cli-config.js'
import { serializeFetchWrapper } from '../src/serializer/serialize-fetch-wrapper.js'

export const vrameworkFetch = async ({ fetchFile, routesMapDeclarationFile, packageMappings }: VrameworkCLIConfig) => {
  await logCommandInfoAndTime('Generating fetch wrapper', 'Generated fetch wrapper', async () => {
    if (!fetchFile) {
      throw new Error('fetchFile is required in vramework config')
    }

    const routesMapDeclarationPath = getFileImportRelativePath(
      fetchFile,
      routesMapDeclarationFile,
      packageMappings
    )

    const content = [
        serializeFetchWrapper(routesMapDeclarationPath)
    ]
    await writeFileInDir(fetchFile, content.join('\n'))
  })
}

export const action = async (
  options: VrameworkCLIOptions
): Promise<void> => {
  logVrameworkLogo()
  const cliConfig = await getVrameworkCLIConfig(options.config, ['rootDir', 'schemaDirectory', 'configDir', 'nextDeclarationFile'], true)
  await vrameworkFetch(cliConfig)
}

export const fetch = (program: Command): void => {
  program
    .command('fetch')
    .description('generate fetch wrapper')
    .option('-c | --config <string>', 'The path to vramework cli config file')
    .action(action)
}
