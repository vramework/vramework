import * as ts from 'typescript'
import { ImportMap } from './inspector.js'

export const addFilesWithSymbols = (program: ts.Program, checker: ts.TypeChecker, functionTypesImportMap: ImportMap, symbolNames: string[]): string | null => {
  for (const sourceFile of program.getSourceFiles()) {
    if (sourceFile.isDeclarationFile) {
      continue
    }
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
        if (declarations && declarations.length > 0) {
          let filePath = declarations[0].getSourceFile().fileName
          const importInfo = functionTypesImportMap.get(filePath) || {
            importPath: filePath,
            variableNames: new Set(),
          }
          importInfo.variableNames.add(symbol.getName())
          functionTypesImportMap.set(filePath, importInfo)
        }
      }
    }
  }

  return null
}