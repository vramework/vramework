import { Command } from 'commander'
import {
  getVrameworkCLIConfig,
  VrameworkCLIConfig,
} from '../src/vramework-cli-config.js'
import { InspectorState } from '@vramework/inspector'
import {
  logCommandInfoAndTime,
  logVrameworkLogo,
  VrameworkCLIOptions,
  writeFileInDir,
} from '../src/utils.js'
import {
  serializeSchedulerMeta,
  serializeSchedulers,
} from '../src/scheduler/serialize-schedulers.js'
import { inspectorGlob } from '../src/inspector-glob.js'

export const vrameworkScheduler = async (
  cliConfig: VrameworkCLIConfig,
  visitState: InspectorState
) => {
  return await logCommandInfoAndTime(
    'Finding scheduled tasks',
    'Found scheduled tasks',
    [visitState.scheduledTasks.files.size === 0],
    async () => {
      const { schedulersFile, packageMappings } = cliConfig
      const { scheduledTasks } = visitState
      const content = [
        serializeSchedulers(
          schedulersFile,
          scheduledTasks.files,
          packageMappings
        ),
        serializeSchedulerMeta(scheduledTasks.meta),
      ]
      await writeFileInDir(schedulersFile, content.join('\n\n'))
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
  await vrameworkScheduler(cliConfig, visitState)
}

export const schedules = (program: Command): void => {
  program
    .command('scheduler')
    .description('Find all scheduled tasks to import')
    .option('-c | --config <string>', 'The path to vramework cli config file')
    .action(action)
}
