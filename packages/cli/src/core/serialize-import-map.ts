import { TypesMap } from '@vramework/inspector'
import { getFileImportRelativePath } from '../utils.js'

export const serializeImportMap = (
  relativeToPath: string,
  packageMappings: Record<string, string>,
  typesMap: TypesMap,
  requiredTypes: Set<string>
) => {
  const paths = new Map<string, string[]>()
  Array.from(requiredTypes).forEach((requiredType) => {
    const { originalName, uniqueName, path } = typesMap.getTypeMeta(requiredType)
    if (!path) {
      return
    }
    const variables = paths.get(path) || []
    if (originalName === uniqueName) {
      variables.push(originalName)
    } else {
      variables.push(`${originalName} as ${uniqueName}`)
    }
    paths.set(path, variables)
  })

  const imports: string[] = []
  for (const [path, variables] of paths.entries()) {
    imports.push(
      `import type { ${variables.join(', ')} } from '${getFileImportRelativePath(relativeToPath, path, packageMappings)}'`
    )
  }
  return imports.join('\n')
}
