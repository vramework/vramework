import * as ts from 'typescript'
import { ImportMap } from './inspector.js'

export const addFilesWithSymbols = (
  program: ts.Program,
  checker: ts.TypeChecker,
  importMap: ImportMap,
  symbolNames: string[]
): string | null => {
  for (const sourceFile of program.getSourceFiles()) {
    const symbols = checker.getSymbolsInScope(
      sourceFile,
      ts.SymbolFlags.Function |
        ts.SymbolFlags.TypeAlias |
        ts.SymbolFlags.Interface |
        ts.SymbolFlags.Class
    )
    for (const symbol of symbols) {
      if (symbolNames.includes(symbol.getName())) {
        const declarations = symbol.getDeclarations()
        const declaration = declarations && declarations[0]
        if (declaration) {
          let filePath = declaration.getSourceFile().fileName
          const importInfo = importMap.get(filePath) || {
            importPath: filePath,
            variableNames: new Set(),
          }
          importInfo.variableNames.add(symbol.getName())
          importMap.set(filePath, importInfo)
        }
      }
    }
  }

  return null
}
