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
  
import { CoreAPIFunction, CoreAPIFunctionSessionless, CoreAPIPermission, MakeRequired } from '@vramework/core'
import { CoreHTTPFunctionRoute, AssertRouteParams } from '@vramework/core/http'
import { CoreScheduledTask } from '@vramework/core/scheduler'
import { CoreAPIChannel, CoreChannelConnection, CoreChannelDisconnection, CoreChannelMessage, VrameworkChannel } from '@vramework/core/channel'

${userSessionTypeImport}
${sessionServicesTypeImport}

export type APIPermission<In = unknown, RequiredServices = ${servicesTypeName}> = CoreAPIPermission<In, RequiredServices, ${userSessionTypeName}>

export type APIFunctionSessionless<In = unknown, Out = never, RequiredServices = ${servicesTypeName}> = CoreAPIFunctionSessionless<In, Out, RequiredServices, ${userSessionTypeName}>
export type APIFunction<In = unknown, Out = never, RequiredServices = ${servicesTypeName}> = CoreAPIFunction<In, Out, RequiredServices, ${userSessionTypeName}>
type APIRoute<In, Out, Route extends string> = CoreHTTPFunctionRoute<In, Out, Route, APIFunction<In, Out>, APIFunctionSessionless<In, Out>, APIPermission<In>>

export type ChannelConnection<Out = never, ChannelData = unknown, RequiredServices extends ${servicesTypeName} = ${servicesTypeName}> = (services: MakeRequired<Services, 'eventHub'>, channel: VrameworkChannel<${userSessionTypeName}, ChannelData, Out>) => Promise<void>
export type ChannelDisconnection<ChannelData = unknown, RequiredServices extends ${servicesTypeName} = ${servicesTypeName}> = (services: MakeRequired<Services, 'eventHub'>, channel: VrameworkChannel<${userSessionTypeName}, ChannelData, never>) => Promise<void>
export type ChannelMessage<In, Out = never, ChannelData = unknown, RequiredServices extends ${servicesTypeName} = ${servicesTypeName}> = (services: MakeRequired<Services, 'eventHub'>, channel: VrameworkChannel<${userSessionTypeName}, ChannelData, Out>, data: In) => Promise<Out | void>
type APIChannel<ChannelData, Channel extends string, In extends unknown, Out extends unknown> = CoreAPIChannel<ChannelData, Channel, ChannelConnection, ChannelDisconnection, ChannelMessage<In, Out, ChannelData>>

type ScheduledTask = CoreScheduledTask<APIFunctionSessionless<void, void>, ${userSessionTypeName}>

declare module "@vramework/core" {
  function addChannel<ChannelData, Channel extends string>(
    channel: APIChannel<ChannelData, Channel> & AssertRouteParams<ChannelData, Channel>
  ): void;

  function addRoute<In, Out, Route extends string>(
    route: APIRoute<In, Out, Route> & AssertRouteParams<In, Route>
  ): void;

  function addScheduledTask(
    task: ScheduledTask
  ): void;
}
`
}
