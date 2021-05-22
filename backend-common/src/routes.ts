import { CoreServices } from './services'
import { CoreUserSession } from './user-session'

export type CoreAPIFunction<In, Out> = (services: CoreServices, data: In, session?: CoreUserSession) => Promise<Out>
export type CoreAPIPermission<In = any> = (services: CoreServices, data: In, session?: CoreUserSession) => Promise<boolean>

export interface CoreAPIRoute<In, Out> {
  type: 'post' | 'get' | 'delete' | 'patch' | 'head'
  route: string
  func: CoreAPIFunction<In, Out>
  schema: string | null
  requiresSession?: false
  permissions?: Record<string, Array<CoreAPIPermission<In>>>
  returnsJSON?: false
}

export type CoreAPIRoutes = Array<CoreAPIRoute<unknown, unknown>>

export const verifyRoutes = (routes: Array<CoreAPIRoute<unknown, unknown>>) => {
  const paths = new Map()
  for (const type of ['get', 'patch', 'delete', 'post', 'head']) {
    paths.set(type, new Set<string[]>())
  }
  routes.forEach((route) => {
    const routes = paths.get(route.type)
    if (routes.has(route.route)) {
      throw `Duplicate route: ${JSON.stringify(route)}`
    }
    routes.add(route.route)
  })
}
