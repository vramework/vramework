/**
 * 
 */
export const serializeVrameworkTypes = (userSessionTypeImport: string, userSessionTypeName: string, sessionServicesTypeImport: string, servicesTypeName: string) => {
  return `/**
* This is used to provide the application types in the typescript project
*/
  
import { CoreAPIFunction, CoreAPIPermission, CoreAPIRoute, addRoute, AssertRouteParams } from '@vramework/core'
  
${userSessionTypeImport}
${sessionServicesTypeImport}

export type APIFunctionSessionless<In, Out, RequiredServices = ${servicesTypeName}> = CoreAPIFunction<In, Out, RequiredServices, ${userSessionTypeName}>
export type APIFunction<In, Out, RequiredServices = ${servicesTypeName}> = CoreAPIFunction<In, Out, RequiredServices, ${userSessionTypeName}>
export type APIPermission<In, RequiredServices = ${servicesTypeName}> = CoreAPIPermission<In, RequiredServices, ${userSessionTypeName}>

type APIRoute<In, Out, Route extends string> = CoreAPIRoute<In, Out, Route, APIFunction<In, Out>, APIFunctionSessionless<In, Out>, APIPermission<In>>

declare module "@vramework/core" {
  export function addRoute<In, Out, Route extends string>(
    route: APIRoute<In, Out, Route> & AssertRouteParams<In, Route>
  ): void;
}
`

}