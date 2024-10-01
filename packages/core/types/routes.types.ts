import { EError } from '../errors'
import { CoreUserSession, CoreServices } from './core.types'

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

type CoreAPIControllerCommon<MicroServices> = {
  contentType?: 'xml' | 'json'
  prefix?: string
  timeout?: number
  version?: {
    from?: SemVer
    to?: SemVer
  }
  microservices: MicroServices
  docs?: Partial<{
    summary: string
    description: string
    tags: string[]
  }>
}

type CoreFunctionlessAPIRoute<MicroServices> = CoreAPIControllerCommon<MicroServices> & {
  route: string
  eventStream?: false
  returnsJSON?: false
  docs?: Partial<{
    response: string
    errors: EError[]
  }>
}

type SemVer = string

export type CoreAPIController<In, APIPermission = CoreAPIPermission<In>, MicroServices extends string[] = []> =
  | (CoreAPIControllerCommon<MicroServices> & {
    permissions?: Record<string, APIPermission[] | APIPermission>;
    auth?: true;
  })
  | (CoreAPIControllerCommon<MicroServices> & {
    permissions?: undefined;
    auth?: false;
  })

export type CoreAPIRoute<
  In,
  Out,
  R extends string,
  MicroServices extends string[],
  APIFunction = CoreAPIFunction<In, Out>,
  APIFunctionSessionless = CoreAPIFunctionSessionless<In, Out>,
  APIPermission = CoreAPIPermission<In>
> =
  | (CoreFunctionlessAPIRoute<MicroServices> & {
    route: R;
    method: APIRouteMethod;
    func: APIFunction;
    permissions?: Record<string, APIPermission[] | APIPermission>;
    auth?: true;
  })
  | (CoreFunctionlessAPIRoute<MicroServices> & {
    route: R;
    method: APIRouteMethod;
    func: APIFunctionSessionless;
    permissions?: undefined;
    auth?: false;
  })
  | (CoreFunctionlessAPIRoute<MicroServices> & {
    route: R;
    method: 'post';
    func: APIFunction;
    permissions?: Record<string, APIPermission[] | APIPermission>;
    auth?: true;
    query?: Array<keyof In>;
  })
  | (CoreFunctionlessAPIRoute<MicroServices> & {
    route: R;
    method: 'post';
    func: APIFunctionSessionless;
    permissions?: undefined;
    auth?: false;
    query?: Array<keyof In>;
  });

export type CoreAPIRoutes = Array<CoreAPIRoute<any, any, string, string[]>>

export type RoutesMeta = Array<{
  route: string,
  method: APIRouteMethod,
  params?: string[],
  query?: string[],
  input: string | null,
  output: string | null
}>