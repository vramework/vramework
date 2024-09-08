import { promises } from 'fs'
import { loadAPIFilePaths } from '@vramework/core/api-routes'

export const generateRoutesImports = async (routesDirPath: string, outputPath?: string): Promise<void> => {
    const results = await loadAPIFilePaths(routesDirPath, routesDirPath, [])
    const routesFile = `
import { APIRoutes } from "./api"

${results.sort().map((path, i) => `import { routes as routes${i} } from '${path}'`).join('\n')}

export const getRoutes = (): APIRoutes => {
    return [
${results.map((_, i) => `\t\t...routes${i}`).join(',\n')}
    ]
}
`   
    if (outputPath) {
        await promises.writeFile(outputPath, routesFile, 'utf-8')
    } else {
        console.log(routesFile)
    }
}
