import { Command } from 'commander'
import {
  getFileImportRelativePath,
  logCommandInfoAndTime,
  logVrameworkLogo,
  VrameworkCLIOptions,
  writeFileInDir,
} from '../src/utils.js'
import {
  getVrameworkCLIConfig,
  VrameworkCLIConfig,
} from '../src/vramework-cli-config.js'
import { serializeWebsocketWrapper } from '../src/channels/serialize-websocket-wrapper.js'

export const vrameworkWebSocket = async ({
  websocketFile,
  channelsMapDeclarationFile,
  packageMappings,
}: VrameworkCLIConfig) => {
  await logCommandInfoAndTime(
    'Generating websocket wrapper',
    'Generated websocket wrapper',
    [
      websocketFile === undefined,
      'websocketFile is required in vramework config',
    ],
    async () => {
      if (!websocketFile) {
        throw new Error('fetchFile is required in vramework config')
      }

      const channelsMapDeclarationPath = getFileImportRelativePath(
        websocketFile,
        channelsMapDeclarationFile,
        packageMappings
      )

      const content = [serializeWebsocketWrapper(channelsMapDeclarationPath)]
      await writeFileInDir(websocketFile, content.join('\n'))
    }
  )
}

export const action = async (options: VrameworkCLIOptions): Promise<void> => {
  logVrameworkLogo()
  const cliConfig = await getVrameworkCLIConfig(
    options.config,
    ['rootDir', 'schemaDirectory', 'configDir', 'fetchFile'],
    true
  )
  await vrameworkWebSocket(cliConfig)
}

export const websocket = (program: Command): void => {
  program
    .command('websocket')
    .description('generate websocket wrapper')
    .option('-c | --config <string>', 'The path to vramework cli config file')
    .action(action)
}
