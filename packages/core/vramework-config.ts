import { join, dirname, resolve } from "path"
import { readdir } from "fs/promises"
import { VrameworkConfig } from "./types"

export const getVrameworkConfig = async (configFile?: string): Promise<VrameworkConfig> => {
    if (!configFile) {
        let execDirectory = process.cwd()
        const files = await readdir(execDirectory)
        const file = files.find((file) => file.endsWith('vramework.config.json'))
        if (!file) {
            throw new Error('config file not found')
        }
        configFile = join(execDirectory, file)
    }

    try {
        const config: VrameworkConfig = await import(configFile)
        const configDir = dirname(configFile)
        // TODO: Validate config
        return {
            ...config,
            rootDir: config.rootDir ? resolve(configDir, config.rootDir) : configDir
        }
    } catch (e) {
        console.error(e)
        console.error(`Config file not found: ${configFile}`)
        process.exit(1)
    }
}