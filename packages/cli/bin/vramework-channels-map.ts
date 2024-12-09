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
import { serializeTypedChannelsMap } from '../src/channels/serialize-typed-channel-map.js'

export const vrameworkChannelsMap = async (
  { channelsMapDeclarationFile, packageMappings }: VrameworkCLIConfig,
  visitState: VisitState
) => {
  return await logCommandInfoAndTime(
    'Creating channels map',
    'Created channels map',
    [visitState.channels.files.size === 0],
    async () => {
      const content = serializeTypedChannelsMap(
        channelsMapDeclarationFile,
        packageMappings,
        visitState.channels.importMap,
        visitState.channels.meta,
      )
      await writeFileInDir(channelsMapDeclarationFile, content)
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
  await vrameworkChannelsMap(cliConfig, visitState)
}

export const channelsMap = (program: Command): void => {
  program
    .command('channels-map')
    .description('Generate a map of all channels to aid in type checking')
    .option('-c | --config <string>', 'The path to vramework cli config file')
    .action(action)
}
