import { promises } from 'fs'
import { loadRoutes } from '@vramework/core/api-routes'
import { join, relative } from 'path'

export const generateRoutesImports = async (
  rootPath: string,
  routesDirPath: string[],
  outputPathFilePath: string
): Promise<string> => {
  const outputPath = join(rootPath, outputPathFilePath)

  let routes: string[] = []
  const { filesWithRoutes } = await loadRoutes(rootPath, routesDirPath)

  const routesFile = filesWithRoutes
  .sort()
  .map((path) => {
    const filePath = relative(outputPath, path)
      .replace('.ts', '')
      .replace('../..', '..')
    routes.push(filePath)
    return `import '${filePath}'`
  }).join('\n')

  const parts = outputPath.split('/')
  parts.pop()

  console.log(`Writing routes to ${outputPath}`)
  await promises.mkdir(parts.join('/'), { recursive: true })
  await promises.writeFile(outputPath, routesFile, 'utf-8')

  return outputPath
}
