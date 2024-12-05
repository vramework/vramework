import { Command } from 'commander'
import {
  getFileImportRelativePath,
  logVrameworkLogo,
  VrameworkCLIOptions,
  writeFileInDir,
} from '../src/utils.js'
import { getVrameworkCLIConfig } from '../src/vramework-cli-config.js'
import { inspectorGlob } from '../src/inspector/inspector-glob.js'
import { vrameworkRoutes } from './vramework-routes.js'
import { vrameworkSchemas } from './vramework-schemas.js'
import { vrameworkNext } from './vramework-nextjs.js'
import { vrameworkFunctionTypes } from './vramework-function-types.js'
import { vrameworkHTTPMap } from './vramework-routes-map.js'
import { existsSync } from 'fs'
import { vrameworkOpenAPI } from './vramework-openapi.js'
import { vrameworkFetch } from './vramework-fetch.js'
import { vrameworkScheduler } from './vramework-scheduler.js'
import { vrameworkChannels } from './vramework-channels.js'
import { vrameworkChannelsMap } from './vramework-channels-map.js'
import { vrameworkWebSocket } from './vramework-websocket.js'

export const action = async (options: VrameworkCLIOptions): Promise<void> => {
  logVrameworkLogo()


  const imports: string[] = []
  const addImport = (from: string) => {
    imports.push(`import '${getFileImportRelativePath(cliConfig.bootstrapFile, from, cliConfig.packageMappings)}'`)
 }

  const cliConfig = await getVrameworkCLIConfig(options.config, [], true)

  let typesDeclarationFileExists = true
  let visitState = await inspectorGlob(
    cliConfig.rootDir,
    cliConfig.routeDirectories
  )
  if (!existsSync(cliConfig.typesDeclarationFile)) {
    typesDeclarationFileExists = false
  }
  await vrameworkFunctionTypes(cliConfig, options, visitState)

  // This is needed since the addRoutes function will add the routes to the visitState
  if (!typesDeclarationFileExists) {
    console.log(`\x1b[34m• Type file first created, inspecting again...\x1b[0m`)
    visitState = await inspectorGlob(
      cliConfig.rootDir,
      cliConfig.routeDirectories
    )
  }

  const routes = await vrameworkRoutes(cliConfig, visitState)
  if (routes) {
    await vrameworkHTTPMap(cliConfig, visitState)
    await vrameworkFetch(cliConfig)
    addImport(cliConfig.routesFile)
  }

  const scheduled = await vrameworkScheduler(cliConfig, visitState)
  if (scheduled) {
    addImport(cliConfig.schedulersFile)
}

  const channels = await vrameworkChannels(cliConfig, visitState)
  if (channels) {
    await vrameworkChannelsMap(cliConfig, visitState)
    await vrameworkWebSocket(cliConfig)
    addImport(cliConfig.channelsFile)
  }

  const schemas = await vrameworkSchemas(cliConfig, visitState)
  if (schemas) {
    addImport(`${cliConfig.schemaDirectory}/register.ts`)
  }

  await vrameworkNext(cliConfig, visitState, options)

  if (cliConfig.openAPI) {
    console.log(
      `\x1b[34m• OpenAPI requires a reinspection to pickup new generated types..\x1b[0m`
    )
    visitState = await inspectorGlob(
      cliConfig.rootDir,
      cliConfig.routeDirectories
    )
    await vrameworkOpenAPI(cliConfig, visitState)
  }

  await writeFileInDir(cliConfig.bootstrapFile, imports.join('\n'))
}

export const all = (program: Command): void => {
  program
    .command('all', { isDefault: true })
    .description('Generate all the files used by vramework')
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
