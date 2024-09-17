import { promises } from 'fs'
import { loadRoutes } from '@vramework/core/api-routes'
import { join, relative } from 'path'

export const generateRoutesImports = async (
  rootPath: string,
  routesDirPath: string[],
  vrameworkTypesModule: string,
  outputPathFilePath: string
): Promise<void> => {
  const outputPath = join(rootPath, outputPathFilePath)

  let routes: string[] = []
  const { filesWithRoutes } = await loadRoutes(rootPath, routesDirPath)

  const routesFile = `
import { APIRoutes } from "${vrameworkTypesModule}"

${filesWithRoutes
  .sort()
  .map((path, i) => {
    const filePath = relative(outputPath, path)
      .replace('.ts', '')
      .replace('../..', '..')
    return `import { routes as routes${i} } from '${filePath}'`
  })
  .join('\n')}

export const getRoutes = (): APIRoutes => {
  return [
  ${routes.map((_, i) => `    ...routes${i}`).join(',\n')}
  ]
}
`
  const parts = outputPath.split('/')
  parts.pop()

  console.log(`Writing routes to ${outputPath}`)
  await promises.mkdir(parts.join('/'), { recursive: true })
  await promises.writeFile(outputPath, routesFile, 'utf-8')
}
