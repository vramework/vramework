import { join, dirname, resolve } from 'path'
import { readdir } from 'fs/promises'
import { VrameworkConfig } from './types/core.types.js'

export const getVrameworkConfig = async (
  configFile: string | undefined = undefined,
  exitProcess: boolean = false
): Promise<VrameworkConfig> => {
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
    const config: VrameworkConfig = await import(configFile)
    const configDir = dirname(configFile)
    // TODO: Validate config
    return {
      ...config,
      configDir,
      rootDir: config.rootDir ? resolve(configDir, config.rootDir) : configDir,
    }
  } catch (e: any) {
    console.error(e)
    console.error(`Config file not found: ${configFile}`)
    process.exit(1)
  }
}
