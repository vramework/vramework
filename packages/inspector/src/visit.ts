import * as ts from 'typescript'
import { addFileWithFactory } from './add-file-with-factory.js'
import { addFileExtendsCoreType } from './add-file-extends-core-type.js'
import { addRoute } from './add-route.js'
import { addSchedule } from './add-schedule.js'
import { addChannel } from './add-channel.js'
import { InspectorState } from './types.js'

export const visit = (
  checker: ts.TypeChecker,
  node: ts.Node,
  state: InspectorState
) => {
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

  addFileWithFactory(node, checker, state.configFactories, 'CreateConfig')

  addRoute(node, checker, state)
  addSchedule(node, checker, state)
  addChannel(node, checker, state)

  ts.forEachChild(node, (child) => visit(checker, child, state))
}
