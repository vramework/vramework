import { loadRoutes } from '@vramework/core/api-routes'
import { relative } from 'path'

export const generateRoutesImports = async (
  rootPath: string,
  routesDirPath: string[],
): Promise<string[]> => {
  const { filesWithRoutes } = await loadRoutes(rootPath, routesDirPath)
  return filesWithRoutes
}

export const serializeRoutes = (outputPath: string, filesWithRoutes: string[]) => {
  return filesWithRoutes
  .sort()
  .map((path) => {
    const filePath = relative(outputPath, path)
      .replace('.ts', '')
      .replace('../..', '..')
    return `import '${filePath}'`
  }).join('\n')
}
