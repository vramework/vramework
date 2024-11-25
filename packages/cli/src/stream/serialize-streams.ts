import { StreamsMeta } from '@vramework/core/stream/stream.types'
import { getFileImportRelativePath } from '../utils.js'

export const serializeStreams = (
  outputPath: string,
  filesWithStreams: Set<string>,
  packageMappings: Record<string, string> = {}
) => {
  const serializedOutput: string[] = [
    '/* The files with an addStream function call */',
  ]

  Array.from(filesWithStreams)
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

export const serializeStreamMeta = (streamsMeta: StreamsMeta) => {
  const serializedOutput: string[] = []
  serializedOutput.push("import { addStreamsMeta } from '@vramework/core'")
  serializedOutput.push(
    `addStreamsMeta(${JSON.stringify(streamsMeta, null, 2)})`
  )
  return serializedOutput.join('\n')
}
