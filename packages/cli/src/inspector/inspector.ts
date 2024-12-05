import * as ts from 'typescript'
import { visit, VisitState } from './visit.js'
import { addFilesWithSymbols } from './add-files-with-symbols.js'

export interface ImportInfo {
  importPath: string
  variableNames: Set<string>
}

export type ImportMap = Map<string, ImportInfo>

export const inspector = (routeFiles: string[]): VisitState => {
  const program = ts.createProgram(routeFiles, {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.CommonJS,
  })
  const checker = program.getTypeChecker()
  const sourceFiles = program.getSourceFiles()

  const state: VisitState = {
    sessionServicesTypeImportMap: new Map(),
    userSessionTypeImportMap: new Map(),
    singletonServicesFactories: new Map(),
    sessionServicesFactories: new Map(),
    configFactories: new Map(),
    http: {
      importMap: new Map(),
      metaInputTypes: new Map(),
      meta: [],
      inputTypes: new Set<string>(),
      outputTypes: new Set<string>(),
      files: new Set<string>(),
    },
    channels: {
      importMap: new Map(),
      metaInputTypes: new Map<string, string>(),
      inputTypes: new Set<string>(),
      outputTypes: new Set<string>(),
      files: new Set<string>(),
      meta: [],
    },
    scheduledTasks: {
      meta: [],
      files: new Set<string>(),
    },
  }

  for (const sourceFile of sourceFiles) {
    ts.forEachChild(sourceFile, (child) => visit(checker, child, state))
  }

  // Looks for and adds all the input/out schema types
  addFilesWithSymbols(program, checker, state.http.importMap, [
    ...state.http.inputTypes,
    ...state.http.outputTypes,
  ])

  addFilesWithSymbols(program, checker, state.channels.importMap, [
    ...state.channels.inputTypes,
    ...state.channels.outputTypes,
  ])

  return state
}
