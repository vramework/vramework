import { promises } from 'fs'

const loadAPIFiles = async (routesDirPath: string, dir: string, filesWithRoutes: string[]): Promise<string[]> => {
    const entries = await promises.readdir(dir)
    await Promise.all(entries.map(async (entry) => {
        const lstat = await promises.lstat(`${dir}/${entry}`)
        if (lstat.isDirectory()) {
            await loadAPIFiles(routesDirPath, `${dir}/${entry}`, filesWithRoutes)
        } else {
            if (entry.endsWith('.ts') && !entry.includes('.spec.')) {
                const file = await import(`${dir}/${entry}`)
                if (file.routes) {
                    filesWithRoutes.push(`./routes${dir}/${entry}`.replace(routesDirPath, '').replace('.ts', ''))
                }
            }
        }
        return
    }))
    return filesWithRoutes
}

export const generateRoutesImports = async (routesDirPath: string, outputPath?: string): Promise<void> => {
    const results = await loadAPIFiles(routesDirPath, routesDirPath, [])
    const routesFile = `
import { APIRoutes } from "./api"

${results.sort().map((path, i) => `import { routes as routes${i} } from '${path}'`).join('\n')}

export const getRoutes = (): APIRoutes => {
    return [
${results.map((path, i) => `\t\t...routes${i}`).join(',\n')}
    ]
}
`   
    if (outputPath) {
        await promises.writeFile(outputPath, routesFile, 'utf-8')
    } else {
        console.log(routesFile)
    }
}
