import { dirname, relative } from 'path'

export const serializeRoutes = (outputPath: string, filesWithRoutes: string[]) => {
  const outputPathDir = dirname(outputPath)
  
  return filesWithRoutes
  .sort()
  .map((path) => {
    const filePath = relative(outputPathDir, path)
      .replace('.ts', '')
    return `import '${filePath}'`
  }).join('\n')
}
