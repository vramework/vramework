import { readdir } from "fs/promises"

export const getVrameworkConfig = async (configFile: string) => {
    if (!configFile) {
        let execDirectory = process.cwd()
        const files = await readdir(execDirectory)
        const file = files.find((file) => file.endsWith('vramework.config.json'))
        if (!file) {
            throw new Error('config file not found')
        }
    }

    try {
        const config = await import(configFile)
        // TODO: Validate config
        return config
    } catch (e) {
        console.error(`Config file not found: ${configFile}`)
        process.exit(1)
    }
}