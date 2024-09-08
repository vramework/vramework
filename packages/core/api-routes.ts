import { promises } from "fs"
import { CoreAPIRoutes } from "./routes"

export const loadAPIFilePaths = async (routesDirPath: string, dir: string, filesWithRoutes: string[]): Promise<string[]> => {
    const entries = await promises.readdir(dir)

    await Promise.all(entries.map(async (entry) => {
        if (dir.includes('node_modules')) {
            return
        }
        const lstat = await promises.lstat(`${dir}/${entry}`)
        if (lstat.isDirectory()) {
            await loadAPIFilePaths(routesDirPath, `${dir}/${entry}`, filesWithRoutes)
        } else {
            if (entry.endsWith('.ts') && !entry.endsWith('.d.ts') && !entry.includes('.spec.')) {
                const file = await import(`${dir}/${entry}`)
                if (file.routes) {
                    filesWithRoutes.push(`${dir}/${entry}`.replace('.ts', ''))
                }
            }
        }
        return
    }))
    return filesWithRoutes
}

export const loadAPIFiles = async (routesDirPaths: string[]) => {
    let apiRoutes: CoreAPIRoutes = []

    for (const routesDirPath of routesDirPaths) {
        const filePaths = await loadAPIFilePaths(routesDirPath, routesDirPath, [])

        for (const path of filePaths) {
            const routes = await import(path)
            apiRoutes = [...apiRoutes, ...routes.routes]
        }
    }

    return apiRoutes
}