import { promises } from 'fs'

const loadAPIFiles = async (routesDirPath: string, dir: string, filesWithRoutes: string[]) => {
    const entries = await promises.readdir(dir)
    await Promise.all(entries.map(async (entry) => {
        const lstat = await promises.lstat(`${dir}/${entry}`)
        if (lstat.isDirectory()) {
            return loadAPIFiles(routesDirPath, `${dir}/${entry}`, filesWithRoutes)
        } else {
            if (entry.endsWith('.ts')) {
                const file = await import(`${dir}/${entry}`)
                if (file.routes) {
                    filesWithRoutes.push(`./routes${dir}/${entry}`.replace(routesDirPath, '').replace('.ts', ''))
                }
            }
        }
    }))
    return filesWithRoutes
}

export const generateRoutesImports = async (routesDirPath: string, outputPath?: string) => {
    const results = await loadAPIFiles(routesDirPath, routesDirPath, [])
    const routesFile = `
import { APIRoutes } from "./api"

${results.map((path, i) => `import { routes as routes${i} } from '${path}'`).join('\n')}

export const getRoutes = (): APIRoutes => {
    return [
    ${results.map((path, i) => `\t...routes${i}`).join(',\n')}
    ]
}
`   
    if (outputPath) {
        await promises.writeFile(outputPath, routesFile, 'utf-8')
    } else {
        console.log(routesFile)
    }
}
