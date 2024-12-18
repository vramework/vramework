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
import { SubscriptionService } from './subscription-service.js'
export type RunChannelOptions = Partial<{
  skipUserSession: boolean
  respondWith404: boolean
  coerceToArray: boolean
  logWarningsForStatusCodes: number[]
}>

export type RunChannelParams<ChannelData> = {
  channelId: string
  singletonServices: CoreSingletonServices
  subscriptionService: SubscriptionService<unknown>
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
) => Promise<void | Out>

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


export interface VrameworkChannel<Session, OpeningData, Out> {
  // The channel identifier
  channelId: string
  // The user session, if available
  session?: Session
  // Update the user session, useful if you deal with auth on the
  // stream side
  setSession: (session: Session) => Promise<void>
  // The data the channel was created with. This could be query parameters
  // or parameters in the url.
  openingData: OpeningData
  // The data to send. This will fail is the stream has been closed.
  send: (data: Out, isBinary?: boolean) => void
  // Broadcast data to all channels, or a subset of selected ones
  broadcast: (data: Out) => void
  // This will close the channel.
  close: () => void
  // The current state of the channel
  state: 'initial' | 'open' | 'closed'
  // subscription service
  subscriptions: SubscriptionService<Out>
}

export interface VrameworkChannelHandler<
  UserSession extends CoreUserSession = CoreUserSession,
  OpeningData = unknown,
  Out = unknown,
> {
  setSession(session: UserSession): Promise<void>
  send(message: Out, isBinary?: boolean): Promise<void>
  getChannel(): VrameworkChannel<UserSession, OpeningData, Out>
}

export type VrameworkChannelHandlerFactory<
UserSession extends CoreUserSession = CoreUserSession,
OpeningData = unknown,
Out = unknown,
> = (channelId: string, openingData: OpeningData, session: UserSession, subscriptionService: SubscriptionService<Out>) => VrameworkChannelHandler<UserSession, OpeningData, Out>