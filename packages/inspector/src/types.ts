import { ChannelsMeta } from "@vramework/core/channel";
import { HTTPRoutesMeta } from "@vramework/core/http";
import { ScheduledTasksMeta } from "@vramework/core/scheduler";
import { TypesMap } from "./types-map.js";

export type PathToNameAndType = Map<
  string,
  { variable: string; type: string | null; typePath: string | null }[]
>

export type MetaInputTypes = Map<string, { query: string[] | undefined, params: string[] | undefined, body: string[] | undefined }>

export interface InspectorHTTPState {
  typesMap: TypesMap
  metaInputTypes: MetaInputTypes
  meta: HTTPRoutesMeta
  files: Set<string>
}

export interface InspectorChannelState {
  typesMap: TypesMap
  metaInputTypes: MetaInputTypes
  meta: ChannelsMeta
  files: Set<string>
}

export interface InspectorState {
  sessionServicesTypeImportMap: PathToNameAndType
  userSessionTypeImportMap: PathToNameAndType
  singletonServicesFactories: PathToNameAndType
  sessionServicesFactories: PathToNameAndType
  configFactories: PathToNameAndType
  http: InspectorHTTPState
  channels: InspectorChannelState
  scheduledTasks: {
    meta: ScheduledTasksMeta
    files: Set<string>
  }
}
