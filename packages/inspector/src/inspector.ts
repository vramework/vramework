import * as ts from 'typescript'
import { visit } from './visit.js'
import { TypesMap } from './types-map.js'
import { InspectorState, InspectorHTTPState } from './types.js'

export const normalizeHTTPTypes = (httpState: InspectorHTTPState): InspectorHTTPState => {
  return httpState
}

export const inspect = (routeFiles: string[]): InspectorState => {
  const program = ts.createProgram(routeFiles, {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.CommonJS,
  })
  const checker = program.getTypeChecker()
  const sourceFiles = program.getSourceFiles()

  const state: InspectorState = {
    sessionServicesTypeImportMap: new Map(),
    userSessionTypeImportMap: new Map(),
    singletonServicesFactories: new Map(),
    sessionServicesFactories: new Map(),
    configFactories: new Map(),
    http: {
      typesMap: new TypesMap(),
      metaInputTypes: new Map(),
      meta: [],
      files: new Set(),
    },
    channels: {
      typesMap: new TypesMap(),
      metaInputTypes: new Map(),
      files: new Set(),
      meta: [],
    },
    scheduledTasks: {
      meta: [],
      files: new Set(),
    },
  }

  for (const sourceFile of sourceFiles) {
    ts.forEachChild(sourceFile, (child) => visit(checker, child, state))
  }

  // Normalise the typesMap

  state.http = normalizeHTTPTypes(state.http)

  return state
}
