import { EError } from '../error-handler.js'
import { RoutesMetaInputTypes } from '../http/routes.types.js'
import { VrameworkHTTPRequest } from '../http/vramework-http-request.js'
import { VrameworkHTTPResponse } from '../http/vramework-http-response.js'
import {
  APIDocs,
  CoreServices,
  CoreSingletonServices,
  CoreUserSession,
  CreateSessionServices,
} from '../types/core.types.js'
import { CoreAPIPermission } from '../types/functions.types.js'
import { VrameworkRequest } from '../vramework-request.js'
import { VrameworkResponse } from '../vramework-response.js'
import { VrameworkStream } from './vramework-stream.js'

export type RunStreamOptions = Partial<{
  skipUserSession: boolean
  respondWith404: boolean
  coerceToArray: boolean
  logWarningsForStatusCodes: number[]
}>

export type RunStreamParams<StreamData> = {
  singletonServices: CoreSingletonServices
  request: VrameworkRequest<StreamData> | VrameworkHTTPRequest<StreamData>
  response: VrameworkResponse | VrameworkHTTPResponse
  createSessionServices: CreateSessionServices<
    CoreSingletonServices,
    CoreUserSession,
    CoreServices
  >
}

export interface HandlerMeta {}

export interface StreamMeta {
  route: string
  params?: string[]
  query?: string[]
  input: string | null
  inputTypes?: RoutesMetaInputTypes
  connect: boolean
  disconnect: boolean
  message: { inputs: string[] | null; outputs: string[] | null } | null
  messageRoutes: Record<string, Record<string, {
    inputs: string[] | null
    outputs: string[] | null
  }>>
  docs?: APIDocs
}

export type StreamsMeta = StreamMeta[]

/**
 * Represents an API route without a function, including metadata such as content type, route, and timeout settings.
 */
type CoreFunctionlessStreamRoute<OnConnectionChange> = {
  route: string
  onConnect?: OnConnectionChange
  onDisconnect?: OnConnectionChange
  docs?: Partial<{
    description: string
    response: string
    errors: Array<typeof EError>
    tags: string[]
  }>
}

export type CoreStreamConnectionSessionless<
  OpenData,
  Services extends CoreServices = CoreServices,
  Session extends CoreUserSession = CoreUserSession,
> = (services: Services, stream: VrameworkStream<OpenData>, session?: Session) => Promise<void>

export type CoreStreamConnection<
  OpenData,
  Services extends CoreServices = CoreServices,
  Session extends CoreUserSession = CoreUserSession,
> = (services: Services, stream: VrameworkStream<OpenData>, session: Session) => Promise<void>

/**
 * Represents a core stream function that performs an operation using core services and a user session.
 *
 * @template In - The input type.
 * @template Services - The services type, defaults to `CoreServices`.
 * @template Session - The session type, defaults to `CoreUserSession`.
 */
export type CoreStreamMessage<
  In,
  Out,
  OpenData,
  Services extends CoreServices = CoreServices,
  Session extends CoreUserSession = CoreUserSession,
> = (services: Services, stream: VrameworkStream<OpenData, In, Out>, session: Session) => Promise<void>

/**
 * Represents a core API function that can be used without a session.
 *
 * @template In - The input type.
 * @template Services - The services type, defaults to `CoreServices`.
 * @template Session - The session type, defaults to `CoreUserSession`.
 */
export type CoreStreamMessageSessionless<
  In,
  Out,
  OpenData,
  Services extends CoreServices = CoreServices,
  Session extends CoreUserSession = CoreUserSession,
> = (services: Services, stream: VrameworkStream<OpenData, In, Out>, session?: Session) => Promise<void>

export type CoreAPIStreamMessage<
  StreamFunctionMessage =
    | CoreStreamMessageSessionless<unknown, unknown, unknown>
    | CoreStreamMessage<unknown, unknown, unknown>,
> = {
  func: StreamFunctionMessage
  route: string
}

export type CoreAPIStream<
  StreamData,
  R extends string,
  StreamFunctionConnection = CoreStreamConnection<StreamData>,
  StreamFunctionConnectionSessionless = CoreStreamConnectionSessionless<StreamData>,
  StreamFunctionMessage = CoreStreamMessage<unknown, unknown, unknown>,
  StreamFunctionMessageSessionless = CoreStreamMessageSessionless<
    unknown,
    unknown,
    unknown
  >,
  APIPermission = CoreAPIPermission<StreamData>,
> =
  | (CoreFunctionlessStreamRoute<StreamFunctionConnection> & {
      route: R
      onMessage?: { func: StreamFunctionMessage, permissions?: undefined }
      onMessageRoute?: Record<string, Record<string, StreamFunctionMessage | { func: StreamFunctionMessage, permissions?: Record<string, APIPermission[] | APIPermission>}>>
      permissions?: Record<string, APIPermission[] | APIPermission>
      auth?: true
    })
  | (CoreFunctionlessStreamRoute<StreamFunctionConnectionSessionless> & {
      route: R
      onMessage?: StreamFunctionMessageSessionless
      onMessageRoute?: Record<string, Record<string, StreamFunctionMessageSessionless | { func: StreamFunctionMessageSessionless, permissions?: undefined }>>
      permissions?: undefined
      auth?: false
    })

export type CoreAPIStreams = CoreAPIStream<any, string>[]
