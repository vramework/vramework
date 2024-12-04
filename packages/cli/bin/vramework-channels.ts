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
    [visitState.filesWithChannels.size === 0],
    async () => {
      const { channelsFile, packageMappings } = cliConfig
      const { filesWithChannels, channelsMeta } = visitState
      const content = [
        serializeChannels(channelsFile, filesWithChannels, packageMappings),
        serializeChannelMeta(channelsMeta),
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

export const streams = (program: Command): void => {
  program
    .command('streams')
    .description('Find all streams to import')
    .option('-c | --config <string>', 'The path to vramework cli config file')
    .action(action)
}
