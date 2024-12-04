import { ChannelsMeta } from '@vramework/core/channel/channel.types'
import { getFileImportRelativePath } from '../utils.js'

export const serializeChannels = (
  outputPath: string,
  filesWithChannels: Set<string>,
  packageMappings: Record<string, string> = {}
) => {
  const serializedOutput: string[] = [
    '/* The files with an addChannel function call */',
  ]

  Array.from(filesWithChannels)
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

export const serializeChannelMeta = (channelsMeta: ChannelsMeta) => {
  const serializedOutput: string[] = []
  serializedOutput.push("import { setChannelsMeta } from '@vramework/core'")
  serializedOutput.push(
    `setChannelsMeta(${JSON.stringify(channelsMeta, null, 2)})`
  )
  return serializedOutput.join('\n')
}
