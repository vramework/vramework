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
    functionTypesImportMap: new Map(),
    metaInputTypes: new Map(),
    scheduledTasksMeta: [],
    routesMeta: [],
    channelsMeta: [],
    inputTypes: new Set<string>(),
    outputTypes: new Set<string>(),
    filesWithRoutes: new Set<string>(),
    filesWithScheduledTasks: new Set<string>(),
    filesWithChannels: new Set<string>(),
    singletonServicesFactories: new Map(),
    sessionServicesFactories: new Map(),
    configFactories: new Map(),
  }

  for (const sourceFile of sourceFiles) {
    ts.forEachChild(sourceFile, (child) => visit(checker, child, state))
  }

  // Looks for and adds all the input/out schema types
  addFilesWithSymbols(program, checker, state.functionTypesImportMap, [
    ...state.inputTypes,
    ...state.outputTypes,
  ])

  return state
}
