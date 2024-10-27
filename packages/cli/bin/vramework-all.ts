import { Command } from 'commander'
import { logVrameworkLogo, VrameworkCLIOptions } from '../src/utils.js'
import { getVrameworkCLIConfig } from '../src/vramework-cli-config.js'
import { inspectorGlob } from '../src/inspector/inspector-glob.js'
import { vrameworkRoutes } from './vramework-routes.js'
import { vrameworkSchemas } from './vramework-schemas.js'
import { vrameworkNext } from './vramework-nextjs.js'
import { vrameworkFunctionTypes } from './vramework-function-types.js'
import { vrameworkRoutesMap } from './vramework-routes-map.js'
import { existsSync } from 'fs'

export const action = async (options: VrameworkCLIOptions): Promise<void> => {
  logVrameworkLogo()

  const cliConfig = await getVrameworkCLIConfig(options.config, [], true)
  
  let typesDeclarationFileExists = true
  let visitState = await inspectorGlob(cliConfig.rootDir, cliConfig.routeDirectories)
  if (!existsSync(cliConfig.typesDeclarationFile)) {
    typesDeclarationFileExists = false
  }
  await vrameworkFunctionTypes(cliConfig, options, visitState)

  // This is needed since the addRoutes function will add the routes to the visitState
  if (!typesDeclarationFileExists) {
    console.log(`\x1b[34m• Type file first created, inspecting again...\x1b[0m`)
    visitState = await inspectorGlob(cliConfig.rootDir, cliConfig.routeDirectories)
  }

  await vrameworkRoutes(cliConfig, visitState)

  await vrameworkRoutesMap(cliConfig, visitState)
  
  await vrameworkSchemas(cliConfig, visitState)
  
  if (cliConfig.nextDeclarationFile) {
    await vrameworkNext(cliConfig, visitState, options)
  }
}

export const all = (program: Command): void => {
  program
    .command('all', { isDefault: true })
    .description('Setup all vramework commands per config')
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
