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

type CoreFunctionlessAPIRoute = {
  contentType?: 'xml' | 'json'
  route: string
  eventStream?: false
  returnsJSON?: false
  timeout?: number
  docs?: Partial<{
    summary: string
    description: string
    response: string
    errors: EError[]
    tags: string[]
  }>
}

export type CoreAPIRoute<
  In,
  Out,
  R extends string,
  APIFunction = CoreAPIFunction<In, Out>,
  APIFunctionSessionless = CoreAPIFunctionSessionless<In, Out>,
  APIPermission = CoreAPIPermission<In>
> =
  | (CoreFunctionlessAPIRoute & {
      route: R;
      method: APIRouteMethod;
      func: APIFunction;
      permissions?: Record<string, APIPermission[] | APIPermission>;
      auth?: true;
    })
  | (CoreFunctionlessAPIRoute & {
      route: R;
      method: APIRouteMethod;
      func: APIFunctionSessionless;
      permissions?: undefined;
      auth?: false;
    })
  | (CoreFunctionlessAPIRoute & {
      route: R;
      method: 'post';
      func: APIFunction;
      permissions?: Record<string, APIPermission[] | APIPermission>;
      auth?: true;
      query?: Array<keyof In>;
    })
  | (CoreFunctionlessAPIRoute & {
      route: R;
      method: 'post';
      func: APIFunctionSessionless;
      permissions?: undefined;
      auth?: false;
      query?: Array<keyof In>;
    });

export type CoreAPIRoutes = Array<CoreAPIRoute<any, any, string>>

export type RoutesMeta = Array<{
  route: string,
  method: APIRouteMethod,
  params?: string[],
  query?: string[],
  input: string | null,
  output: string | null
}>