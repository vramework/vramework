import { relative } from 'path'

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
