import { Command } from 'commander'
import {
  getVrameworkCLIConfig,
  VrameworkCLIConfig,
} from '../src/vramework-cli-config.js'
import { VisitState } from '../src/inspector/visit.js'
import { inspectorGlob } from '../src/inspector/inspector-glob.js'
import {
  logCommandInfoAndTime,
  logVrameworkLogo,
  VrameworkCLIOptions,
  writeFileInDir,
} from '../src/utils.js'
import {
  serializeChannels,
  serializeChannelMeta,
} from '../src/channels/serialize-channels.js'

export const vrameworkChannels = async (
  cliConfig: VrameworkCLIConfig,
  visitState: VisitState
) => {
  return await logCommandInfoAndTime(
    'Finding Channels',
    'Found channels',
    [visitState.channels.files.size === 0],
    async () => {
      const { channelsFile, packageMappings } = cliConfig
      const { channels } = visitState
      const content = [
        serializeChannels(channelsFile, channels.files, packageMappings),
        serializeChannelMeta(channels.meta),
      ]
      await writeFileInDir(channelsFile, content.join('\n\n'))
    }
  )
}

async function action(cliOptions: VrameworkCLIOptions): Promise<void> {
  logVrameworkLogo()

  const cliConfig = await getVrameworkCLIConfig(cliOptions.config, [
    'rootDir',
    'routeDirectories',
    'routesFile',
  ])
  const visitState = await inspectorGlob(
    cliConfig.rootDir,
    cliConfig.routeDirectories
  )
  await vrameworkChannels(cliConfig, visitState)
}

export const channels = (program: Command): void => {
  program
    .command('channels')
    .description('Find all channels to import')
    .option('-c | --config <string>', 'The path to vramework cli config file')
    .action(action)
}
