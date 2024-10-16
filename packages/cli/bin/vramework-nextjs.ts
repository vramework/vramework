import { Command } from 'commander'
import { getVrameworkConfig } from '@vramework/core/vramework-config'
import * as promises from 'fs/promises'
import path = require('path')
import { generateNextJsWrapper } from '../src/nextjs-wrapper-generator'
import { getFileImportRelativePath } from '../src/utils'

async function action(configImport: string, servicesImport: string, { configFile }: { configFile?: string }): Promise<void> {
  const vrameworkConfig = await getVrameworkConfig(configFile, true)
  let { vrameworkNextFile, rootDir, routesOutputFile, configDir, packageMappings, schemaOutputDirectory } = vrameworkConfig

  if (
    !configDir ||
    !rootDir ||
    !routesOutputFile ||
    !vrameworkNextFile ||
    !schemaOutputDirectory
  ) {
    console.error(
      'rootDir, vrameworkNextFile, routesOutputFile and schemaOutputDirectory are required in vramework.config.json'
    )
    process.exit(1)
  }

  const startedAt = Date.now()
  console.log(`
Generating Vramework NextJS File:
    - VrameworkNextJSFile: \n\t${vrameworkNextFile}
    - Route Output:\n\t${routesOutputFile}
    - Schemas directory:\n\t${schemaOutputDirectory}
    - Config import: \n\t${configImport}
    - Services import: \n\t${servicesImport}
`)

//   const importedConfig = await import(configImport)
//   if (importedConfig.config === undefined) {
//     console.error(`${configImport} does not export a config object`)
//     process.exit(1)
//   }

//   const importServiceFactory = await import(servicesImport)
//   if (importServiceFactory.createSessionServices === undefined || importServiceFactory.createSingletonServices === undefined) {
//     console.error(`${configImport} does not export the createSessionServices and createSingletonServices functions.`)
//     process.exit(1)
//   }

  const routesPath = getFileImportRelativePath(path.join(configDir, vrameworkNextFile), path.join(rootDir, routesOutputFile), packageMappings)
  const schemasPath = getFileImportRelativePath(path.join(configDir, vrameworkNextFile), path.join(rootDir, schemaOutputDirectory, 'schemas.ts'), packageMappings)

  const content = [
    generateNextJsWrapper(routesPath, schemasPath, configImport, servicesImport)
  ]

  const output = path.join(configDir, vrameworkNextFile).split('/')
  output.pop()
  const outputDirectory = output.join('/')

  await promises.mkdir(outputDirectory, { recursive: true })
  await promises.writeFile(path.join(configDir, vrameworkNextFile), content.join('\n\n'), 'utf-8')

  console.log(`NextJSWrapper generated in ${Date.now() - startedAt}ms.`)
}

export const nextjs = (program: Command): void => {
  program
    .command('nextjs')
    .description('generate nextjs wrapper')
    .argument('config-file', 'The path to the application config file')
    .argument('services-file', 'The path to the services files')
    .option('-c | --config <string>', 'The path to vramework config file')
    .action(action)
}
