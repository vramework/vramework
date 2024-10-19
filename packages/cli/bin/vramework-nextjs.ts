import { Command } from 'commander'
import { getVrameworkConfig } from '@vramework/core/vramework-config'
import * as promises from 'fs/promises'
import path = require('path')
import { generateNextJsWrapper } from '../src/nextjs-wrapper-generator'
import { getFileImportRelativePath } from '../src/utils'
import { extractVrameworkInformation } from '../src/extract-vramework-information'

async function action({ configFile, vrameworkConfigFile, vrameworkConfigVariable, singletonServicesFactoryFile, singletonServicesFactoryVariable, sessionServicesFactoryFile, sessionServicesFactoryVariable}: { configFile?: string, vrameworkConfigFile?: string, vrameworkConfigVariable?: string, configImport?: string, singletonServicesFactoryFile?: string, singletonServicesFactoryVariable?: string, sessionServicesFactoryFile?: string, sessionServicesFactoryVariable?: string }): Promise<void> {
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

  const routesPath = getFileImportRelativePath(path.join(configDir, vrameworkNextFile), path.join(rootDir, routesOutputFile), packageMappings)
  const schemasPath = getFileImportRelativePath(path.join(configDir, vrameworkNextFile), path.join(rootDir, schemaOutputDirectory, 'schemas.ts'), packageMappings)

  const {
    vrameworkConfigs,
    sessionServicesFactories,
    singletonServicesFactories
  } = await extractVrameworkInformation(vrameworkConfig)

  let errors: string[] = []
  if (!vrameworkConfigFile) {
    let totalValues = Object.values(vrameworkConfigs).flat()
    if (totalValues.length === 0) {
      errors.push('No config import defined and no VrameworkConfig object found')
    } else if (totalValues.length > 1) {
      errors.push('No config import defined and more than one VrameworkConfig found')
      errors.push(Object.values(vrameworkConfigs).join('-\n'))
    } else {
      vrameworkConfigFile = Object.keys(vrameworkConfigs)[0]
    }
  }
  if (!singletonServicesFactoryFile) {
    let totalValues = Object.values(sessionServicesFactories).flat()
    if (totalValues.length === 0) {
      errors.push('No singleton-services-factory-file config defined and no CreateSingletonServices function found')
    } else if (totalValues.length > 1) {
      errors.push('No singleton-services-factory-file config defined and more than one CreateSingletonServices function found')
      errors.push(totalValues.join('-\n'))
    } else {
      singletonServicesFactoryFile = Object.keys(sessionServicesFactories)[0]
      singletonServicesFactoryVariable = Object.values(sessionServicesFactories)[0][0]
    }
  }
  if (!sessionServicesFactoryFile) {
    let totalValues = Object.values(singletonServicesFactories).flat()
    if (totalValues.length === 0) {
      errors.push('No session-services-factory-file config defined and no CreateSessionServices object function found')
    } else if (totalValues.length > 1) {
      errors.push('No session-services-factory-file config defined and more than one CreateSingletonService function found')
      errors.push(totalValues.join('-\n'))
    } else {
      sessionServicesFactoryFile = Object.keys(sessionServicesFactories)[0]
      sessionServicesFactoryVariable = Object.values(sessionServicesFactories)[0][0]
    }
  }

  if (errors) {
    console.error(errors)
    process.exit(1)
  }

  const vrameworkConfigImport = `import { ${vrameworkConfigVariable} } from '${vrameworkConfigFile}'`
  const singletonServicesImport = `import { ${singletonServicesFactoryVariable} } from '${singletonServicesFactoryFile}'`
  const sessionServicesImport = `import { ${sessionServicesFactoryVariable} } from '${sessionServicesFactoryFile}'`
      
  console.log(`
    Generating Vramework NextJS File:
        - VrameworkNextJSFile: \n\t${vrameworkNextFile}
        - Route Output:\n\t${routesOutputFile}
        - Schemas directory:\n\t${schemaOutputDirectory}
        - Vramework Config import: \n\t${vrameworkConfigImport}
        - Singleton Services import: \n\t${singletonServicesImport}
        - Session Services import: \n\t${sessionServicesImport}
    `)

  const content = [
    generateNextJsWrapper(routesPath, schemasPath, vrameworkConfigImport, singletonServicesImport, sessionServicesImport)
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
    .option('-vc | --vramework-config-file', 'The path to the vramework config file with an object called config with type VrameworkConfig')
    .option('-si | --singleton-services-factory-file', 'The path to the application config file with a function called createSingletonServices with type CreateSingletonServices')
    .option('-se | --session-services-factory-file', 'The path to the services file')
    .option('-c | --config <string>', 'The path to vramework cli config file')
    .action(action)
}
