import { CoreUserSession, CoreServices } from './types'

export type CoreAPIFunction<In, Out> = (
  services: CoreServices,
  data: In,
  session?: CoreUserSession
) => Promise<Out>
export type CoreAPIPermission<In = any> = (
  services: CoreServices,
  data: In,
  session?: CoreUserSession
) => Promise<boolean>

export type CoreAPIRoute<In, Out> = {
  type: 'post' | 'get' | 'delete' | 'patch' | 'head'
  contentType?: 'xml' | 'json'
  route: string
  schema: string | null
  requiresSession?: false | true
  eventStream?: false
  permissions?: Record<string, CoreAPIPermission<In>[] | CoreAPIPermission<In>>
  returnsJSON?: false
  timeout?: number
  func: CoreAPIFunction<In, Out>
}

export type CoreAPIRoutes = Array<CoreAPIRoute<unknown, unknown>>
