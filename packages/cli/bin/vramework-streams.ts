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
import { serializeStreams, serializeStreamMeta } from '../src/stream/serialize-streams.js'

export const vrameworkStreams = async (
  cliConfig: VrameworkCLIConfig,
  visitState: VisitState
) => {
  return await logCommandInfoAndTime(
    'Finding streams',
    'Found streams',
    async () => {
      const { streamsFile, packageMappings } = cliConfig
      const { filesWithStreams, streamsMeta } = visitState
      const content = [
        serializeStreams(
          streamsFile,
          filesWithStreams,
          packageMappings
        ),
        serializeStreamMeta(streamsMeta),
      ]
      await writeFileInDir(streamsFile, content.join('\n\n'))
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
  await vrameworkStreams(cliConfig, visitState)
}

export const streams = (program: Command): void => {
  program
    .command('streams')
    .description('Find all streams to import')
    .option('-c | --config <string>', 'The path to vramework cli config file')
    .action(action)
}
