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
import { CoreAPIStream, CoreStreamConnect, CoreStreamConnectSessionless, CoreStreamDisconnect, CoreStreamDisconnectSessionless, CoreStreamMessage, CoreStreamMessageSessionless } from '@vramework/core'

${userSessionTypeImport}
${sessionServicesTypeImport}

export type APIFunctionSessionless<In, Out, RequiredServices = ${servicesTypeName}> = CoreAPIFunctionSessionless<In, Out, RequiredServices, ${userSessionTypeName}>
export type APIFunction<In, Out, RequiredServices = ${servicesTypeName}> = CoreAPIFunction<In, Out, RequiredServices, ${userSessionTypeName}>
export type APIPermission<In, RequiredServices = ${servicesTypeName}> = CoreAPIPermission<In, RequiredServices, ${userSessionTypeName}>

export type StreamConnect<StreamData = unknown, RequiredServices extends ${servicesTypeName} = ${servicesTypeName}> = CoreStreamConnect<StreamData, RequiredServices, UserSession>
export type StreamDisconnect<StreamData = unknown, RequiredServices extends ${servicesTypeName} = ${servicesTypeName}> = CoreStreamDisconnect<StreamData, RequiredServices, UserSession>
export type StreamMessage<In, Out, StreamData = unknown, RequiredServices extends ${servicesTypeName} = ${servicesTypeName}> = CoreStreamMessage<In, Out, StreamData, RequiredServices, UserSession>

export type StreamConnectSessionless<StreamData = unknown, RequiredServices extends ${servicesTypeName} = ${servicesTypeName}> = CoreStreamConnectSessionless<StreamData, RequiredServices, UserSession>
export type StreamDisconnectSessionless<StreamData = unknown, RequiredServices extends ${servicesTypeName} = ${servicesTypeName}> = CoreStreamDisconnectSessionless<StreamData, RequiredServices, UserSession>
export type StreamMessageSessionless<In, Out, StreamData = unknown, RequiredServices extends ${servicesTypeName} = ${servicesTypeName}> = CoreStreamMessageSessionless<In, Out, StreamData, RequiredServices, UserSession>

type APIRoute<In, Out, Route extends string> = CoreAPIRoute<In, Out, Route, APIFunction<In, Out>, APIFunctionSessionless<In, Out>, APIPermission<In>>
type APIStream<In, Route extends string> = CoreAPIStream<In, Route, StreamConnect, StreamConnectSessionless, StreamDisconnect, StreamDisconnectSessionless, StreamMessage<unknown, unknown>, StreamMessageSessionless<unknown, unknown>>
type ScheduledTask = CoreScheduledTask<APIFunctionSessionless<void, void>, UserSession>

declare module "@vramework/core" {
  function addRoute<In, Out, Route extends string>(
    route: APIRoute<In, Out, Route> & AssertRouteParams<In, Route>
  ): void;

  function addStream<In, Route extends string>(
    route: APIStream<In, Route> & AssertRouteParams<In, Route>
  ): void;

  function addScheduledTask(task: ScheduledTask): void;
}
`
}
