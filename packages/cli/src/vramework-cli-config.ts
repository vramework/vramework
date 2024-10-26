import { join, dirname, resolve } from 'path'
import { readdir } from 'fs/promises'

export interface VrameworkCLIConfig {
  extends?: string

  rootDir: string
  routeDirectories: string[]
  packageMappings: Record<string, string>

  configDir: string
  tsconfig: string

  routesFile: string
  typesFile: string
  schemaDirectory: string
  vrameworkNextFile?: string
  routesMapFile?: string
}

export const getVrameworkCLIConfig = async (
  configFile: string | undefined = undefined,
  exitProcess: boolean = false
): Promise<VrameworkCLIConfig> => {
  if (!configFile) {
    let execDirectory = process.cwd()
    const files = await readdir(execDirectory)
    const file = files.find((file) => file.endsWith('vramework.config.json'))
    if (!file) {
      const errorMessage =
        '\nConfig file vramework.config.json not found\nExiting...'
      if (exitProcess) {
        console.error(errorMessage)
        process.exit(1)
      }
      throw new Error(errorMessage)
    }
    configFile = join(execDirectory, file)
  }

  try {
    const config: VrameworkCLIConfig = await import(configFile)
    const configDir = dirname(configFile)
    if (config.extends) {
      const extendedConfig = await getVrameworkCLIConfig(
        resolve(configDir, config.extends),
        exitProcess
      )
      return {
        ...extendedConfig,
        ...config,
        configDir,
        packageMappings: {
          ...extendedConfig.packageMappings,
          ...config.packageMappings,
        },
      }
    }
    return {
      ...config,
      configDir,
      packageMappings: config.packageMappings || {},
      rootDir: config.rootDir ? resolve(configDir, config.rootDir) : configDir,
    }
  } catch (e: any) {
    console.error(e)
    console.error(`Config file not found: ${configFile}`)
    process.exit(1)
  }
}

export const validateCLIConfig = (cliConfig: VrameworkCLIConfig, required: Array<keyof VrameworkCLIConfig>) => {
  let errors: string[] = []
  for (const key of required) {
    if (!cliConfig[key]) {
      errors.push(key)
    }
  }

  if (errors.length > 0) {
    console.error(`${errors.join(', ')} ${errors.length === 1 ? 'is' : 'are'} required in vramework.config.json`)
    process.exit(1)
  }
}
