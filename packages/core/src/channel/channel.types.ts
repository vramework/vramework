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
import { VrameworkChannel } from './vramework-channel.js'

export type RunChannelOptions = Partial<{
  skipUserSession: boolean
  respondWith404: boolean
  coerceToArray: boolean
  logWarningsForStatusCodes: number[]
}>

export type RunChannelParams<ChannelData> = {
  singletonServices: CoreSingletonServices
  request: VrameworkRequest<ChannelData> | VrameworkHTTPRequest<ChannelData>
  response: VrameworkResponse | VrameworkHTTPResponse
  createSessionServices: CreateSessionServices<
    CoreSingletonServices,
    CoreUserSession,
    CoreServices
  >
}

export interface HandlerMeta {}

export interface ChannelMeta {
  channel: string
  params?: string[]
  query?: string[]
  input: string | null
  inputTypes?: RoutesMetaInputTypes
  connect: boolean
  disconnect: boolean
  message: { inputs: string[] | null; outputs: string[] | null } | null
  messageRoutes: Record<
    string,
    Record<
      string,
      {
        inputs: string[] | null
        outputs: string[] | null
      }
    >
  >
  docs?: APIDocs
}

export type ChannelsMeta = ChannelMeta[]

/**
 * Represents an API route without a function, including metadata such as content type, route, and timeout settings.
 */
type CoreFunctionlessChannelRoute<OnConnectionChange> = {
  channel: string
  onConnect?: OnConnectionChange
  onDisconnect?: OnConnectionChange
  docs?: Partial<{
    description: string
    response: string
    errors: Array<typeof EError>
    tags: string[]
  }>
}

export type CoreChannelConnectionSessionless<
  OpenData,
  Services extends CoreServices = CoreServices,
  Session extends CoreUserSession = CoreUserSession,
> = (
  services: Services,
  stream: VrameworkChannel<OpenData>,
  session?: Session
) => Promise<void>

export type CoreChannelConnection<
  OpenData,
  Services extends CoreServices = CoreServices,
  Session extends CoreUserSession = CoreUserSession,
> = (
  services: Services,
  stream: VrameworkChannel<OpenData>,
  session: Session
) => Promise<void>

/**
 * Represents a core stream function that performs an operation using core services and a user session.
 *
 * @template In - The input type.
 * @template Services - The services type, defaults to `CoreServices`.
 * @template Session - The session type, defaults to `CoreUserSession`.
 */
export type CoreChannelMessage<
  In,
  Out,
  OpenData,
  Services extends CoreServices = CoreServices,
  Session extends CoreUserSession = CoreUserSession,
> = (
  services: Services,
  stream: VrameworkChannel<OpenData, In, Out>,
  session: Session
) => Promise<void>

/**
 * Represents a core API function that can be used without a session.
 *
 * @template In - The input type.
 * @template Services - The services type, defaults to `CoreServices`.
 * @template Session - The session type, defaults to `CoreUserSession`.
 */
export type CoreChannelMessageSessionless<
  In,
  Out,
  OpenData,
  Services extends CoreServices = CoreServices,
  Session extends CoreUserSession = CoreUserSession,
> = (
  services: Services,
  stream: VrameworkChannel<OpenData, In, Out>,
  session?: Session
) => Promise<void>

export type CoreAPIChannelMessage<
  ChannelFunctionMessage =
    | CoreChannelMessageSessionless<unknown, unknown, unknown>
    | CoreChannelMessage<unknown, unknown, unknown>,
> = {
  func: ChannelFunctionMessage
  route: string
}

export type CoreAPIChannel<
  ChannelData,
  Channel extends string,
  ChannelFunctionConnection = CoreChannelConnection<ChannelData>,
  ChannelFunctionConnectionSessionless = CoreChannelConnectionSessionless<ChannelData>,
  ChannelFunctionMessage = CoreChannelMessage<unknown, unknown, unknown>,
  ChannelFunctionMessageSessionless = CoreChannelMessageSessionless<
    unknown,
    unknown,
    unknown
  >,
  APIPermission = CoreAPIPermission<ChannelData>,
> =
  | (CoreFunctionlessChannelRoute<ChannelFunctionConnection> & {
      onMessage?: { func: ChannelFunctionMessage; permissions?: undefined }
      onMessageRoute?: Record<
        string,
        Record<
          string,
          | ChannelFunctionMessage
          | {
              func: ChannelFunctionMessage
              permissions?: Record<string, APIPermission[] | APIPermission>
            }
        >
      >
      permissions?: Record<string, APIPermission[] | APIPermission>
      auth?: true
    })
  | (CoreFunctionlessChannelRoute<ChannelFunctionConnectionSessionless> & {
      onMessage?: ChannelFunctionMessageSessionless
      onMessageRoute?: Record<
        string,
        Record<
          string,
          | ChannelFunctionMessageSessionless
          | { func: ChannelFunctionMessageSessionless; permissions?: undefined }
        >
      >
      permissions?: undefined
      auth?: false
    })

export type CoreAPIChannels = CoreAPIChannel<any, string>[]
