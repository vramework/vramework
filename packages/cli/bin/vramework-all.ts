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
import { vrameworkRoutesMap } from './vramework-routes-map.js'
import { existsSync } from 'fs'
import { vrameworkOpenAPI } from './vramework-openapi.js'
import { vrameworkFetch } from './vramework-fetch.js'
import { vrameworkScheduler } from './vramework-scheduler.js'
import { vrameworkStreams } from './vramework-streams.js'

export const action = async (options: VrameworkCLIOptions): Promise<void> => {
  logVrameworkLogo()

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

  await vrameworkRoutes(cliConfig, visitState)

  await vrameworkRoutesMap(cliConfig, visitState)

  await vrameworkScheduler(cliConfig, visitState)

  await vrameworkStreams(cliConfig, visitState)

  await vrameworkSchemas(cliConfig, visitState)

  if (cliConfig.nextJSfile) {
    await vrameworkNext(cliConfig, visitState, options)
  }

  if (cliConfig.fetchFile) {
    await vrameworkFetch(cliConfig)
  }

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

  const bootstrapImports: string[] = []
  bootstrapImports.push(
    `import '${getFileImportRelativePath(cliConfig.bootstrapFile, `${cliConfig.schemaDirectory}/register.ts`, cliConfig.packageMappings)}'`
  )
  bootstrapImports.push(
    `import '${getFileImportRelativePath(cliConfig.bootstrapFile, cliConfig.routesFile, cliConfig.packageMappings)}'`
  )
  bootstrapImports.push(
    `import '${getFileImportRelativePath(cliConfig.bootstrapFile, cliConfig.schedulersFile, cliConfig.packageMappings)}'`
  )
  bootstrapImports.push(
    `import '${getFileImportRelativePath(cliConfig.bootstrapFile, cliConfig.streamsFile, cliConfig.packageMappings)}'`
  )
  await writeFileInDir(cliConfig.bootstrapFile, bootstrapImports.join('\n'))
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
