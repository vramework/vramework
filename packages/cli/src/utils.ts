import { relative, dirname } from 'path'

export const getFileImportRelativePath = (from: string, to: string, packageMappings: Record<string, string>): string => {
    const outputDirName = dirname(to)

    let filePath = relative(outputDirName, from)
    for (const [path, packageName] of Object.entries(packageMappings)) {
      if (to.includes(path)) {
        filePath = to.replace(new RegExp(`.*${path}`), packageName)
        break
      }
    }
    return filePath.replace('.ts', '')
  }