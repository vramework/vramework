import * as ts from "typescript"
import { addFileWithConfig } from "./add-file-with-config.js"
import { addFileWithFactory } from "./add-file-with-factory.js"
import { ImportMap } from "./inspector.js"
import { addFileExtendsCoreType } from "./add-file-extends-core-type.js"
import { RoutesMeta } from "@vramework/core/types/routes.types"
import { addRoute } from "./add-route.js"

export type PathToNameAndType =  Map<string, { variable: string, type: string | null, typePath: string | null }[]>

export interface VisitState {
  sessionServicesTypeImportMap: PathToNameAndType,
  userSessionTypeImportMap: PathToNameAndType,
  functionTypesImportMap: ImportMap,
  routesMeta: RoutesMeta,
  inputTypes: Set<string>,
  outputTypes: Set<string>,
  filesWithRoutes: Set<string>,
  singletonServicesFactories: PathToNameAndType,
  sessionServicesFactories: PathToNameAndType,
  vrameworkConfigs: PathToNameAndType
}

export const visit = (checker: ts.TypeChecker, node: ts.Node, state: VisitState) => {
    addFileExtendsCoreType(
      node, 
      checker,
      state.sessionServicesTypeImportMap, 
      'CoreServices'
    )

    addFileExtendsCoreType(
      node, 
      checker,
      state.userSessionTypeImportMap, 
      'CoreUserSession'
    )

    addFileWithConfig(
      node, 
      checker,
      state.vrameworkConfigs, 
    )

    addFileWithFactory(
      node,
      checker,
      state.singletonServicesFactories,
      'CreateSingletonServices'
    )

    addFileWithFactory(
      node, 
      checker,
      state.sessionServicesFactories, 
      'CreateSessionServices'
    )

    addRoute(node, checker, state)

    ts.forEachChild(node, (child) => visit(checker, child, state))
  }