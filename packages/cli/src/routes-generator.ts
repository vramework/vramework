import { promises } from 'fs'
import { loadAPIFilePaths } from '@vramework/core/api-routes'
import { join } from 'path'

export const generateRoutesImports = async (rootPath: string, routesDirPath: string[], outputPathFilePath?: string): Promise<void> => {
    let routes: string[] = []
    for (const dir of routesDirPath) {
        const absPath = join(rootPath, dir)
        const results = await loadAPIFilePaths(absPath, absPath, [])
        routes = [...routes, ...results]
    }

    const routesFile = `
import { CoreAPIRoutes } from "@vramework/core/routes"

${routes.sort().map((path, i) => `import { routes as routes${i} } from '${path}'`).join('\n')}

export const getRoutes = (): CoreAPIRoutes => {
    return [
${routes.map((_, i) => `\t\t...routes${i}`).join(',\n')}
    ] as unknown as CoreAPIRoutes
}
`
    if (outputPathFilePath) {
        const outputPath = join(rootPath, outputPathFilePath)
        const parts = outputPath.split('/')
        parts.pop()

        await promises.mkdir(parts.join('/'), { recursive: true })
        await promises.writeFile(outputPath, routesFile, 'utf-8')
    } else {
        console.log(routesFile)
    }
}
