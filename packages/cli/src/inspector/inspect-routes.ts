import * as ts from 'typescript'
import { visit, VisitState } from './visit.js'
import { addFilesWithSymbols } from './add-files-with-symbols.js'

export interface ImportInfo {
  importPath: string
  namedImports: Set<string>
}

export type ImportMap = Map<string, ImportInfo>

export const inspectRoutes = (routeFiles: string[]): VisitState => {
  const program = ts.createProgram(routeFiles, {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.CommonJS,
  })
  const checker = program.getTypeChecker()
  const sourceFiles = program.getSourceFiles()

  const state: VisitState = {
    typesImportMap: new Map(),
    routesMeta: [],
    inputTypes: new Set<string>(),
    outputTypes: new Set<string>(),
    filesWithRoutes: new Set<string>(),
    singletonServicesFactories: {},
    sessionServicesFactories: {},
    vrameworkConfigs: {}
  }

  for (const sourceFile of sourceFiles) {
    ts.forEachChild(sourceFile, (child) => visit(checker, child, state))
  }

  addFilesWithSymbols(program, checker, state.typesImportMap, [...state.inputTypes, ...state.outputTypes])

  return state
}
