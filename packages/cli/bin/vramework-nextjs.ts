import { Command } from 'commander'
import { getVrameworkCLIConfig } from '@vramework/core/vramework-cli-config'
import * as promises from 'fs/promises'
import path = require('path')
import { generateNextJsWrapper } from '../src/nextjs-wrapper-generator'
import { getFileImportRelativePath, getVrameworkFilesAndMethods } from '../src/utils'

interface VrameworkNextJSCliOptions {
  configFile?: string, vrameworkConfigFile?: string, vrameworkConfigVariable?: string, configImport?: string, singletonServicesFactoryFile?: string, singletonServicesFactoryVariable?: string, sessionServicesFactoryFile?: string, sessionServicesFactoryVariable?: string
}

export const action = async (options: VrameworkNextJSCliOptions): Promise<void> => {
  const { configFile } = options
  const vrameworkConfig = await getVrameworkCLIConfig(configFile, true)
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

  const _nextOutputFile = path.join(configDir, vrameworkNextFile).split('/')
  _nextOutputFile.pop()
  const nextOutputDirectory = _nextOutputFile.join('/')
  const nextOutputFile = path.join(configDir, vrameworkNextFile)

  try {
    const { vrameworkConfigFile, vrameworkConfigVariable, singletonServicesFactoryFile, singletonServicesFactoryVariable, sessionServicesFactoryFile, sessionServicesFactoryVariable } = await getVrameworkFilesAndMethods(vrameworkConfig, nextOutputFile, options)
    const vrameworkConfigImport = `import { ${vrameworkConfigVariable} } from '${getFileImportRelativePath(nextOutputFile, vrameworkConfigFile!, packageMappings)}'`
    const singletonServicesImport = `import { ${singletonServicesFactoryVariable} } from '${getFileImportRelativePath(nextOutputFile, singletonServicesFactoryFile!, packageMappings)}'`
    const sessionServicesImport = `import { ${sessionServicesFactoryVariable} } from '${getFileImportRelativePath(nextOutputFile, sessionServicesFactoryFile!, packageMappings)}'`
  
    const routesPath = getFileImportRelativePath(path.join(configDir, vrameworkNextFile), path.join(rootDir, routesOutputFile), packageMappings)
    const schemasPath = getFileImportRelativePath(path.join(configDir, vrameworkNextFile), path.join(rootDir, schemaOutputDirectory, 'schemas.ts'), packageMappings)
  
    console.log(`
      Generating Vramework NextJS File:
          - VrameworkNextJSFile: \n\t\t${nextOutputFile}
          - Route Output:\n\t\t${routesPath}
          - Schemas directory:\n\t\t${schemasPath}
          - Vramework Config import: \n\t\t${vrameworkConfigImport}
          - Singleton Services import: \n\t\t${singletonServicesImport}
          - Session Services import: \n\t\t${sessionServicesImport}
      `)
  
    const content = generateNextJsWrapper(routesPath, schemasPath, vrameworkConfigImport, singletonServicesImport, sessionServicesImport)
    await promises.mkdir(nextOutputDirectory, { recursive: true })
    await promises.writeFile(nextOutputFile, content, 'utf-8')
  
    console.log(`NextJSWrapper generated in ${Date.now() - startedAt}ms.`)
  } catch {
    // Do nothing, error should be logged
    process.exit(1)
  }

}

export const nextjs = (program: Command): void => {
  program
    .command('nextjs')
    .description('generate nextjs wrapper')
    .option('-vc | --vramework-config-file', 'The path to the vramework config file with an object called config with type VrameworkConfig')
    .option('-si | --singleton-services-factory-file', 'The path to the application config file with a function called createSingletonServices with type CreateSingletonServices')
    .option('-sef | --session-services-factory-file', 'The path to the services file')
    .option('-c | --config <string>', 'The path to vramework cli config file')
    .action(action)
}
