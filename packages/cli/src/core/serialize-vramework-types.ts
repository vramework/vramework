/**
 *
 */
export const serializeVrameworkTypes = (
  userSessionTypeImport: string,
  userSessionTypeName: string,
  sessionServicesTypeImport: string,
  servicesTypeName: string
) => {
  return `/**
* This is used to provide the application types in the typescript project
*/
  
import { CoreAPIFunction, CoreAPIFunctionSessionless, CoreAPIPermission } from '@vramework/core'
import { CoreHTTPFunction, AssertRouteParams } from '@vramework/core/http'
import { CoreScheduledTask } from '@vramework/core/scheduler'
import { CoreAPIChannel, CoreChannelConnection, CoreChannelDisconnection, CoreChannelMessage, VrameworkChannel } from '@vramework/core/channel'

${userSessionTypeImport}
${sessionServicesTypeImport}

export type APIPermission<In = unknown, RequiredServices = ${servicesTypeName}> = CoreAPIPermission<In, RequiredServices, ${userSessionTypeName}>

export type APIFunctionSessionless<In = unknown, Out = never, RequiredServices = ${servicesTypeName}> = CoreAPIFunctionSessionless<In, Out, RequiredServices, ${userSessionTypeName}>
export type APIFunction<In = unknown, Out = never, RequiredServices = ${servicesTypeName}> = CoreAPIFunction<In, Out, RequiredServices, ${userSessionTypeName}>
type APIRoute<In, Out, Route extends string> = CoreHTTPFunction<In, Out, Route, APIFunction<In, Out>, APIFunctionSessionless<In, Out>, APIPermission<In>>

export type ChannelConnection<Out = never, ChannelData = unknown, RequiredServices extends ${servicesTypeName} = ${servicesTypeName}> = (services: Services, channel: VrameworkChannel<Session, ChannelData, Out>) => Promise<void>
export type ChannelDisconnection<ChannelData = unknown, RequiredServices extends ${servicesTypeName} = ${servicesTypeName}> = (services: Services, channel: VrameworkChannel<Session, ChannelData, never>) => Promise<void>
export type ChannelMessage<In, Out = never, ChannelData = unknown, RequiredServices extends ${servicesTypeName} = ${servicesTypeName}> = (services: Services, channel: VrameworkChannel<UserSession, ChannelData, Out>, data: In) => Promise<void>
type APIChannel<ChannelData, Channel extends string> = CoreAPIChannel<ChannelData, Channel, ChannelConnection, ChannelDisconnection, ChannelMessage<unknown, unknown, ChannelData>>

type ScheduledTask = CoreScheduledTask<APIFunctionSessionless<void, void>, UserSession>

declare module "@vramework/core" {
  function addChannel<ChannelData, Channel extends string>(
    channel: APIChannel<ChannelData, Channel> & AssertRouteParams<ChannelData, Channel>
  ): void;
}

declare module "@vramework/core" {
  function addRoute<In, Out, Route extends string>(
    route: APIRoute<In, Out, Route> & AssertRouteParams<In, Route>
  ): void;
}

declare module "@vramework/core" {
  function addScheduledTask<In, Out, Route extends string>(
    route: APIRoute<In, Out, Route> & AssertRouteParams<In, Route>
  ): void;
}
`
}
