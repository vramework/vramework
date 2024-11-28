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
  
import { CoreAPIFunction, CoreAPIFunctionSessionless, CoreAPIPermission, CoreAPIRoute, AssertRouteParams } from '@vramework/core'
import { CoreScheduledTask } from '@vramework/core'
import { CoreAPIChannel, CoreChannelConnection, CoreChannelConnectionSessionless, CoreChannelMessage, CoreChannelMessageSessionless } from '@vramework/core'

${userSessionTypeImport}
${sessionServicesTypeImport}

export type APIFunctionSessionless<In, Out, RequiredServices = ${servicesTypeName}> = CoreAPIFunctionSessionless<In, Out, RequiredServices, ${userSessionTypeName}>
export type APIFunction<In, Out, RequiredServices = ${servicesTypeName}> = CoreAPIFunction<In, Out, RequiredServices, ${userSessionTypeName}>
export type APIPermission<In, RequiredServices = ${servicesTypeName}> = CoreAPIPermission<In, RequiredServices, ${userSessionTypeName}>

export type ChannelConnection<ChannelData = unknown, RequiredServices extends ${servicesTypeName} = ${servicesTypeName}> = CoreChannelConnection<ChannelData, RequiredServices, UserSession>
export type ChannelMessage<In, Out = unknown, ChannelData = unknown, RequiredServices extends ${servicesTypeName} = ${servicesTypeName}> = CoreChannelMessage<In, Out, ChannelData, RequiredServices, UserSession>
export type ChannelConnectionSessionless<ChannelData = unknown, RequiredServices extends ${servicesTypeName} = ${servicesTypeName}> = CoreChannelConnectionSessionless<ChannelData, RequiredServices, UserSession>
export type ChannelMessageSessionless<In, Out = unknown, ChannelData = unknown, RequiredServices extends ${servicesTypeName} = ${servicesTypeName}> = CoreChannelMessageSessionless<In, Out, ChannelData, RequiredServices, UserSession>

type APIRoute<In, Out, Route extends string> = CoreAPIRoute<In, Out, Route, APIFunction<In, Out>, APIFunctionSessionless<In, Out>, APIPermission<In>>
type APIChannel<In, Route extends string> = CoreAPIChannel<In, Route, ChannelConnection, ChannelConnectionSessionless, ChannelMessage<unknown, unknown>, ChannelMessageSessionless<unknown, unknown>>
type ScheduledTask = CoreScheduledTask<APIFunctionSessionless<void, void>, UserSession>

declare module "@vramework/core" {
  function addRoute<In, Out, Route extends string>(
    route: APIRoute<In, Out, Route> & AssertRouteParams<In, Route>
  ): void;

  function addChannel<In, Route extends string>(
    route: APIChannel<In, Route> & AssertRouteParams<In, Route>
  ): void;

  function addScheduledTask(task: ScheduledTask): void;
}
`
}
