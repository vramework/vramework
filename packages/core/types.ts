import { Logger, LogLevel } from './services/logger'
import { PermissionService, SessionService } from './services'
import { VrameworkRequest } from './vramework-request'
import { VrameworkResponse } from './vramework-response'

export type JSONPrimitive = string | number | boolean | null | undefined

export type JSONValue =
  | JSONPrimitive
  | JSONValue[]
  | {
      [key: string]: JSONValue
    }

export type PickRequired<T, K extends keyof T> = Pick<T, K> & Partial<T>
export type PickOptional<T, K extends keyof T> = Omit<T, K> & Partial<T>
export type RequireAtLeastOne<T> = {
  [K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>
}[keyof T]

export interface VrameworkConfig {
  rootDir: string
  routeDirectories: string[]
  vrameworkTypesModule: string
  routesOutputFile?: string

  schemaOutputDirectory: string
  tsconfig: string
}

export interface CoreConfig {
  logLevel: LogLevel
  port: number
  maximumComputeTime?: number
  healthCheckPath?: string
  secrets?: {}
  limits?: Partial<Record<string, string>>
}

export interface CoreUserSession {}

export type RequestHeaders =
  | Record<string, string | string[] | undefined>
  | ((headerName: string) => string | string[] | undefined)

export interface CoreSingletonServices {
  sessionService?: SessionService
  permissionService?: PermissionService
  config: CoreConfig
  logger: Logger
}

export interface CoreServices extends CoreSingletonServices {}

export interface CoreHTTPServices extends CoreServices {
  request: VrameworkRequest
  response: VrameworkResponse
}

export type CreateSingletonServices = (
  config: CoreConfig
) => Promise<CoreSingletonServices>

export type CreateSessionServices = (
  services: CoreSingletonServices & {
    request: VrameworkRequest
    response: VrameworkResponse
  },
  session: CoreUserSession | undefined
) => Promise<CoreServices>

export type VrameworkQuery<T = unknown> = Record<
  string,
  string | T | null | Array<T | null>
>
