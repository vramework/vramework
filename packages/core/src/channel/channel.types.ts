import { EError } from '../errors/error-handler.js'
import { HTTPFunctionMetaInputTypes } from '../http/http-routes.types.js'
import { VrameworkHTTPAbstractRequest } from '../http/vramework-http-abstract-request.js'
import { VrameworkHTTPAbstractResponse } from '../http/vramework-http-abstract-response.js'
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
import { VrameworkChannel } from './vramework-channel-handler.js'

export type RunChannelOptions = Partial<{
  skipUserSession: boolean
  respondWith404: boolean
  coerceToArray: boolean
  logWarningsForStatusCodes: number[]
}>

export type RunChannelParams<ChannelData> = {
  channelId: string
  singletonServices: CoreSingletonServices
  request?:
    | VrameworkRequest<ChannelData>
    | VrameworkHTTPAbstractRequest<ChannelData>
  response?: VrameworkResponse | VrameworkHTTPAbstractResponse
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
  inputTypes?: HTTPFunctionMetaInputTypes
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

export type CoreChannelConnection<
  ChannelData,
  Out = unknown,
  Services extends CoreServices = CoreServices,
  Session extends CoreUserSession = CoreUserSession,
> = (
  services: Services,
  channel: VrameworkChannel<Session, ChannelData, Out>
) => Promise<void>

export type CoreChannelDisconnection<
  ChannelData,
  Services extends CoreServices = CoreServices,
  Session extends CoreUserSession = CoreUserSession,
> = (
  services: Services,
  channel: VrameworkChannel<Session, ChannelData, never>
) => Promise<void>

/**
 * Represents a core channel function that performs an operation using core services and a user session.
 *
 * @template In - The input type.
 * @template Services - The services type, defaults to `CoreServices`.
 * @template Session - The session type, defaults to `CoreUserSession`.
 */
export type CoreChannelMessage<
  In,
  Out,
  ChannelData,
  Services extends CoreServices = CoreServices,
  Session extends CoreUserSession = CoreUserSession,
> = (
  services: Services,
  channel: VrameworkChannel<Session, ChannelData, Out>,
  data: In
) => Promise<void>

export type CoreAPIChannelMessage<
  ChannelFunctionMessage = CoreChannelMessage<unknown, unknown, unknown>,
> = {
  func: ChannelFunctionMessage
  route: string
}

export type CoreAPIChannel<
  ChannelData,
  Channel extends string,
  ChannelFunctionConnection = CoreChannelConnection<ChannelData>,
  ChannelFunctionDisconnection = CoreChannelConnection<ChannelData>,
  ChannelFunctionMessage = CoreChannelMessage<unknown, unknown, unknown>,
  APIPermission = CoreAPIPermission<ChannelData>,
> = {
  channel: string
  onConnect?: ChannelFunctionConnection
  onDisconnect?: ChannelFunctionDisconnection
  onMessage?:
    | {
        func: ChannelFunctionMessage
        permissions?: Record<string, APIPermission[] | APIPermission>
        auth?: boolean
      }
    | ChannelFunctionMessage
  onMessageRoute?: Record<
    string,
    Record<
      string,
      | ChannelFunctionMessage
      | {
          func: ChannelFunctionMessage
          permissions?: Record<string, APIPermission[] | APIPermission>
          auth?: boolean
        }
    >
  >
  permissions?: Record<string, APIPermission[] | APIPermission>
  auth?: boolean
  docs?: Partial<{
    description: string
    response: string
    errors: Array<typeof EError>
    tags: string[]
  }>
}

export type CoreAPIChannels = CoreAPIChannel<any, string>[]
