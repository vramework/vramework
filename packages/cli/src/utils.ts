import { relative, dirname } from 'path'

export const getFileImportRelativePath = (from: string, to: string, packageMappings: Record<string, string> = {}): string => {
    let filePath = relative(dirname(from), to)
    for (const [path, packageName] of Object.entries(packageMappings)) {
      if (to.includes(path)) {
        filePath = to.replace(new RegExp(`.*${path}`), packageName)
        break
      }
    }
    return filePath.replace('.ts', '')
  }