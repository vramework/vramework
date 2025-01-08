import { getFileImportRelativePath } from '../utils.js'

export const serializeRoutes = (
  outputPath: string,
  filesWithRoutes: Set<string>,
  packageMappings: Record<string, string> = {}
) => {
  const serializedOutput: string[] = [
    '/* The files with an addRoute function call */',
  ]

  Array.from(filesWithRoutes)
    .sort()
    .forEach((path) => {
      const filePath = getFileImportRelativePath(
        outputPath,
        path,
        packageMappings
      )
      serializedOutput.push(`import '${filePath}'`)
    })

  return serializedOutput.join('\n')
}
