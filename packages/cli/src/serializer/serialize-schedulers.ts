import { getFileImportRelativePath } from '../utils.js'

export const serializeSchedulers = (
  outputPath: string,
  filesWithScheduledTasks: Set<string>,
  packageMappings: Record<string, string> = {}
) => {
  const serializedOutput: string[] = [
    '/* The files with an addSerializedTasks function call */',
  ]

  Array.from(filesWithScheduledTasks)
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
