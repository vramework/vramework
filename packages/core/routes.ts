import { EError } from './errors'
import { CoreUserSession, CoreServices } from './types'

export type CoreAPIFunction<In, Out, Services = CoreServices, Session = CoreUserSession> = (
  services: Services,
  data: In,
  session: Session
) => Promise<Out>

export type CoreAPIFunctionSessionless<In, Out, Services = CoreServices, Session = CoreUserSession> = (
  services: Services,
  data: In,
  session?: Session
) => Promise<Out>

export type CoreAPIPermission<In = any, Services = CoreServices, Session = CoreUserSession> = (
  services: Services,
  data: In,
  session?: Session
) => Promise<boolean>

export type APIRouteMethod = 'post' | 'get' | 'delete' | 'patch' | 'head'

type CoreFunctionlessAPIRoute<In> = {
  contentType?: 'xml' | 'json'
  route: string
  schema?: string | null
  eventStream?: false
  returnsJSON?: false
  timeout?: number
  docs?: Partial<{
    summary: string
    description: string
    response: string
    errors: EError[]
    query: Array<keyof In>
    tags: string[]
  }>
}

export type CoreAPIRoute<In, Out, APIFunction = CoreAPIFunction<In, Out>, APIFunctionSessionless = CoreAPIFunctionSessionless<In, Out>, APIPermission = CoreAPIPermission<In>> =
  (CoreFunctionlessAPIRoute<In> & {
    method: APIRouteMethod
    func: APIFunction
    permissions?: Record<string, APIPermission[] | APIPermission>
    requiresSession?: true
  }) | (CoreFunctionlessAPIRoute<In> & {
    method: APIRouteMethod
    func: APIFunctionSessionless
    permissions?: undefined
    requiresSession?: false
  }) |  (CoreFunctionlessAPIRoute<In> & {
    method: 'post'
    func: APIFunction
    permissions?: Record<string, APIPermission[] | APIPermission>
    requiresSession?: true
    query?: Array<keyof In>
  }) | (CoreFunctionlessAPIRoute<In> & {
    method: 'post'
    func: APIFunctionSessionless
    permissions?: undefined
    requiresSession?: false
    query?: Array<keyof In>
  })

export type CoreAPIRoutes = Array<CoreAPIRoute<unknown, unknown>>
