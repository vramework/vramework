import { EError } from "../error-handler.js"
import { RoutesMetaInputTypes } from "../http/routes.types.js"
import { VrameworkHTTPRequest } from "../http/vramework-http-request.js"
import { VrameworkHTTPResponse } from "../http/vramework-http-response.js"
import { APIDocs, CoreServices, CoreSingletonServices, CoreStreamServices, CoreUserSession, CreateSessionServices } from "../types/core.types.js"
import { CoreAPIPermission } from "../types/functions.types.js"
import { VrameworkRequest } from "../vramework-request.js"
import { VrameworkStream } from "./vramework-stream.js"

export type RunStreamOptions = Partial<{
  skipUserSession: boolean
  respondWith404: boolean
  coerceToArray: boolean
  logWarningsForStatusCodes: number[]
}>

export type RunStreamParams<In> = {
  singletonServices: CoreSingletonServices
  request: VrameworkRequest<In> | VrameworkHTTPRequest<In>
  response: VrameworkRequest<In> | VrameworkHTTPResponse
  stream: VrameworkStream
  createSessionServices: CreateSessionServices<
    CoreSingletonServices,
    CoreUserSession,
    CoreServices
  >
}

export interface HandlerMeta {

}

export interface StreamMeta {
  route: string
  params?: string[]
  query?: string[]
  input: string | null
  inputTypes?: RoutesMetaInputTypes
  connect?: { 
    input: string | null
  }
  disconnect?: { 
  }
  messages: Array<{
    route: string
    input: string | null
    output: string | null
  }>
  docs?: APIDocs
}

export type StreamsMeta = StreamMeta[]

/**
 * Represents an API route without a function, including metadata such as content type, route, and timeout settings.
 */
type CoreFunctionlessStreamRoute<OnConnect, OnDisconnect> = {
  route: string
  onConnect?: OnConnect,
  onDisconnect?: OnDisconnect,
  docs?: Partial<{
    description: string
    response: string
    errors: Array<typeof EError>
    tags: string[]
  }>
}

/**
 * Represents a core stream function that performs an operation using core services and a user session.
 *
 * @template In - The input type.
 * @template Services - The services type, defaults to `CoreServices`.
 * @template Session - The session type, defaults to `CoreUserSession`.
 */
export type CoreStreamConnect<
  In,
  Services extends CoreStreamServices = CoreStreamServices,
  Session = CoreUserSession,
> = (services: Services, data: In, session: Session) => Promise<void>

/**
* Represents a core API function that can be used without a session.
*
* @template In - The input type.
* @template Services - The services type, defaults to `CoreServices`.
* @template Session - The session type, defaults to `CoreUserSession`.
*/
export type CoreStreamConnectSessionless<
  In,
  Services = CoreServices,
  Session = CoreUserSession,
> = (services: Services, data: In, session?: Session) => Promise<void>

/**
 * Represents a core stream function that performs an operation using core services and a user session.
 *
 * @template In - The input type.
 * @template Services - The services type, defaults to `CoreServices`.
 * @template Session - The session type, defaults to `CoreUserSession`.
 */
export type CoreStreamDisconnect<
  In,
  Services extends CoreStreamServices = CoreStreamServices,
  Session = CoreUserSession,
> = (services: Services, data: In, session: Session) => Promise<void>

/**
* Represents a core API function that can be used without a session.
*
* @template In - The input type.
* @template Services - The services type, defaults to `CoreServices`.
* @template Session - The session type, defaults to `CoreUserSession`.
*/
export type CoreStreamDisconnectSessionless<
  In,
  Services = CoreServices,
  Session = CoreUserSession,
> = (services: Services, data: In, session?: Session) => Promise<void>


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
  Services extends CoreStreamServices = CoreStreamServices,
  Session = CoreUserSession,
> = (services: Services, data: In, session: Session) => Promise<Out>

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
  Services = CoreServices,
  Session = CoreUserSession,
> = (services: Services, data: In, session?: Session) => Promise<Out>

export type CoreAPIStreamMessage<StreamFunctionMessage = CoreStreamMessageSessionless<unknown, unknown> | CoreStreamMessage<unknown, unknown>> = {
  func: StreamFunctionMessage,
  route: string
}

export type CoreAPIStream<
  In,
  R extends string,
  StreamFunctionConnect = CoreStreamConnect<In>,
  StreamFunctionConnectSessionless = CoreStreamConnectSessionless<In>,
  StreamFunctionDisconnect = CoreStreamDisconnect<In>,
  StreamFunctionDisconnectSessionless = CoreStreamDisconnectSessionless<In>,
  StreamFunctionMessage = CoreStreamMessage<unknown, unknown>,
  StreamFunctionMessagesSessionless = CoreStreamMessageSessionless<unknown, unknown>,
  APIPermission = CoreAPIPermission<In>,
> =
  | (CoreFunctionlessStreamRoute<StreamFunctionConnect, StreamFunctionDisconnect> & {
    route: R
    onMessage: Array<CoreAPIStreamMessage<StreamFunctionMessage>>,
    permissions?: Record<string, APIPermission[] | APIPermission>,
    auth?: true
  })
  | (CoreFunctionlessStreamRoute<StreamFunctionConnectSessionless, StreamFunctionDisconnectSessionless> & {
    route: R
    onMessage: Array<CoreAPIStreamMessage<StreamFunctionMessagesSessionless>>
    permissions?: undefined
    auth?: false
  })

export type CoreAPIStreams = CoreAPIStream<any, string>[]