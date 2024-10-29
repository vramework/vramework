import { ImportMap } from "../inspector/inspector.js"
import { getFileImportRelativePath } from "../utils.js"

export const serializeImportMap = (relativeToPath: string, packageMappings: Record<string, string>, importMap: ImportMap, filterTypes?: string[]) => {
    let imports: string[] = []
    for (const [importPath, { variableNames }] of importMap) {
      const variables = filterTypes ? Array.from(variableNames).filter((variable) => filterTypes.includes(variable)) : Array.from(variableNames)
      imports.push(
        `import type { ${variables.join(', ')} } from '${getFileImportRelativePath(relativeToPath, importPath, packageMappings)}'`
      )
    }
    return imports.join('\n')
  }
  