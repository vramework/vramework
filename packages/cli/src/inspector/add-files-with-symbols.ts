import * as ts from 'typescript'
import { ImportMap } from './inspect-routes.js'

export const addFilesWithSymbols = (program: ts.Program, checker: ts.TypeChecker, typesImportMap: ImportMap, symbolNames: string[]): string | null => {
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
          const importInfo = typesImportMap.get(filePath) || {
            importPath: filePath,
            namedImports: new Set(),
          }
          importInfo.namedImports.add(symbol.getName())
          typesImportMap.set(filePath, importInfo)
        }
      }
    }
  }

  return null
}