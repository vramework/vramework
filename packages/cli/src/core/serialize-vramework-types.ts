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
import { CoreStreamConnect, CoreStreamConnectSessionless, CoreStreamDisconnect, CoreStreamDisconnectSessionless, CoreStreamMessage, CoreStreamMessageSessionless } from '@vramework/core'

${userSessionTypeImport}
${sessionServicesTypeImport}

export type APIFunctionSessionless<In, Out, RequiredServices = ${servicesTypeName}> = CoreAPIFunctionSessionless<In, Out, RequiredServices, ${userSessionTypeName}>
export type APIFunction<In, Out, RequiredServices = ${servicesTypeName}> = CoreAPIFunction<In, Out, RequiredServices, ${userSessionTypeName}>
export type APIPermission<In, RequiredServices = ${servicesTypeName}> = CoreAPIPermission<In, RequiredServices, ${userSessionTypeName}>

export type StreamConnect<In, RequiredServices = ${servicesTypeName}> = CoreStreamConnect<In, RequiredServices, UserSession>
export type StreamDisconnect<RequiredServices = ${servicesTypeName}> = CoreStreamDisconnect<RequiredServices, UserSession>
export type StreamMessage<In, Out, RequiredServices = ${servicesTypeName}> = CoreStreamMessage<In, Out, RequiredServices, UserSession>

export type StreamConnectSessionless<In, RequiredServices = ${servicesTypeName}> = CoreStreamConnectSessionless<In, RequiredServices, UserSession>
export type StreamDisconnectSessionless<In, RequiredServices = ${servicesTypeName}> = CoreStreamDisconnectSessionless<RequiredServices, UserSession>
export type StreamMessageSessionless<In, Out, RequiredServices = ${servicesTypeName}> = CoreStreamMessageSessionless<In, Out, RequiredServices, UserSession>

type APIRoute<In, Out, Route extends string> = CoreAPIRoute<In, Out, Route, APIFunction<In, Out>, APIFunctionSessionless<In, Out>, APIPermission<In>>
type APIStream<In, Out, Route extends string> = CoreAPIStream<In, Route, StreamConnect, StreamConnectSessionless, StreamDisconnect, StreamDisconnectSessionless, StreamMessage, StreamMessageSessionless>
type ScheduledTask = CoreScheduledTask<APIFunctionSessionless<void, void>>

declare module "@vramework/core" {
  function addRoute<In, Out, Route extends string>(
    route: APIRoute<In, Out, Route> & AssertRouteParams<In, Route>
  ): void;

  function addStream<In, Out, Route extends string>(
    route: APIStream<In, Out, Route> & AssertRouteParams<In, Route>
  ): void;

  function addScheduledTask(task: ScheduledTask): void;
}
`
}
