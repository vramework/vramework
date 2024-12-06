import * as ts from 'typescript'
import { addFileWithFactory } from './add-file-with-factory.js'
import { ImportMap } from './inspector.js'
import { addFileExtendsCoreType } from './add-file-extends-core-type.js'
import { RoutesMeta } from '@vramework/core/http/routes.types'
import { ChannelsMeta } from '@vramework/channel'
import { ScheduledTasksMeta } from '@vramework/core/scheduler/schedule.types'
import { addRoute } from './add-route.js'
import { addSchedule } from './add-schedule.js'
import { addChannel } from './add-channel.js'

export type PathToNameAndType = Map<
  string,
  { variable: string; type: string | null; typePath: string | null }[]
>

export interface VisitState {
  sessionServicesTypeImportMap: PathToNameAndType
  userSessionTypeImportMap: PathToNameAndType
  singletonServicesFactories: PathToNameAndType
  sessionServicesFactories: PathToNameAndType
  configFactories: PathToNameAndType
  http: {
    importMap: ImportMap
    metaInputTypes: Map<string, string>
    meta: RoutesMeta
    inputTypes: Set<string>
    outputTypes: Set<string>
    files: Set<string>
  }
  channels: {
    importMap: ImportMap
    metaInputTypes: Map<string, string>
    meta: ChannelsMeta
    inputTypes: Set<string>
    outputTypes: Set<string>
    files: Set<string>
  }
  scheduledTasks: {
    meta: ScheduledTasksMeta
    files: Set<string>
  }
}

export const visit = (
  checker: ts.TypeChecker,
  node: ts.Node,
  state: VisitState
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
