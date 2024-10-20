import { relative, dirname } from 'path'
import { extractVrameworkInformation } from './extract-vramework-information'
import { VrameworkCLIConfig } from '@vramework/core/types/core.types'

export const getFileImportRelativePath = (from: string, to: string, packageMappings: Record<string, string> = {}): string => {
    let filePath = relative(dirname(from), to)
    for (const [path, packageName] of Object.entries(packageMappings)) {
      if (to.includes(path)) {
        filePath = to.replace(new RegExp(`.*${path}`), packageName)
        break
      }
    }
    return filePath.replace('.ts', '')
  }

  interface FilesAndMethods {
    vrameworkConfigFile: string,
    vrameworkConfigVariable: string,
    singletonServicesFactoryFile: string,
    singletonServicesFactoryVariable: string,
    sessionServicesFactoryFile: string,
    sessionServicesFactoryVariable: string
  }

export const getVrameworkFilesAndMethods = async (cliConfig: VrameworkCLIConfig, outputFile: string, filesAndMethods: Partial<FilesAndMethods>): Promise<FilesAndMethods> => {
  let {
    vrameworkConfigFile,
    vrameworkConfigVariable = 'vrameworkConfig',
    singletonServicesFactoryFile,
    singletonServicesFactoryVariable = 'createSingletonServices',
    sessionServicesFactoryFile,
    sessionServicesFactoryVariable = 'createSessionServices'
  } = filesAndMethods

  const {
    vrameworkConfigs,
    sessionServicesFactories,
    singletonServicesFactories
  } = await extractVrameworkInformation(cliConfig)

  let errors = new Map<string, Record<string, string[]>>()
  
  if (!vrameworkConfigFile) {
    let totalValues = Object.values(vrameworkConfigs).flat()
    if (totalValues.length === 0) {
      errors.set('No VrameworkConfig object found', vrameworkConfigs)
    } else if (totalValues.length > 1) {
      errors.set('More than one VrameworkConfig found', vrameworkConfigs)
    } else {
      vrameworkConfigFile = Object.keys(vrameworkConfigs)[0]
      vrameworkConfigVariable = Object.values(vrameworkConfigs)[0][0]
    }
  }
  if (!singletonServicesFactoryFile) {
    let totalValues = Object.values(singletonServicesFactories).flat()
    if (totalValues.length === 0) {
      errors.set('No CreateSingletonServices function found', singletonServicesFactories)
    } else if (totalValues.length > 1) {
      errors.set('More than one CreateSingletonServices function found', singletonServicesFactories)
    } else {
      singletonServicesFactoryFile = Object.keys(singletonServicesFactories)[0]
      singletonServicesFactoryVariable = Object.values(singletonServicesFactories)[0][0]
    }
  }
  if (!sessionServicesFactoryFile) {
    let totalValues = Object.values(sessionServicesFactories).flat()
    if (totalValues.length === 0) {
      errors.set('No CreateSessionServices object function found', sessionServicesFactories)
    } else if (totalValues.length > 1) {
      errors.set('More than one CreateSingletonService function found', sessionServicesFactories)
    } else {
      sessionServicesFactoryFile = Object.keys(sessionServicesFactories)[0]
      sessionServicesFactoryVariable = Object.values(sessionServicesFactories)[0][0]
    }
  }

  if (errors.size > 0) {
    const result: string[] = ['Found errors:']
    
    errors.forEach((filesAndMethods, message) => {
      result.push(`- ${message}`)
      for (const [file, methods] of Object.entries(filesAndMethods as Record<string, string[]>)) {
        result.push(`\t* file: ${getFileImportRelativePath(outputFile, file, cliConfig.packageMappings)}`)  
        result.push(`\t* methods: ${methods.join(', ')}`)
      }
    })

    console.error(result.join('\n'))
    throw new Error("Can't find required the require files and methods")
  }

  return {
    vrameworkConfigFile,
    vrameworkConfigVariable,
    singletonServicesFactoryFile,
    singletonServicesFactoryVariable,
    sessionServicesFactoryFile,
    sessionServicesFactoryVariable
  } as FilesAndMethods
}