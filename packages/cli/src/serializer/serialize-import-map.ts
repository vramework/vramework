import { ImportMap } from "../inspector/inspector.js"
import { getFileImportRelativePath } from "../utils.js"

export const serializeImportMap = (relativeToPath: string, packageMappings: Record<string, string>, importMap: ImportMap) => {
    let imports: string[] = []
    for (const [importPath, { variableNames }] of importMap) {
      imports.push(
        `import { ${Array.from(variableNames).join(', ')} } from '${getFileImportRelativePath(relativeToPath, importPath, packageMappings)}'`
      )
    }
    return imports.join('\n')
  }
  