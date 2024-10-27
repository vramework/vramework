import { Logger, LogLevel } from '../services/logger.js'
import { PermissionService, SessionService } from '../services/index.js'
import { VrameworkRequest } from '../vramework-request.js'
import { VrameworkResponse } from '../vramework-response.js'

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

export interface CoreConfig {
  logLevel: LogLevel
  maximumComputeTime?: number
  secrets?: {}
}

export type CoreServerConfig = CoreConfig & {
  port: number
  hostname: string
  healthCheckPath?: string
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

export interface VrameworkInteraction {
  request: VrameworkRequest
  response: VrameworkResponse
}

export type CoreServices<SingletonServices = CoreSingletonServices> = SingletonServices & VrameworkInteraction

export type CreateSingletonServices<
  Config extends CoreConfig,
  SingletonServices extends CoreSingletonServices,
> = (config: Config, ...args: any[]) => Promise<SingletonServices>

export type CreateSessionServices<
  SingletonServices extends CoreSingletonServices,
  UserSession extends CoreUserSession,
  Services extends CoreServices<SingletonServices>,
> = (
  services: SingletonServices,
  interaction: VrameworkInteraction,
  session: UserSession | undefined
) => Promise<Omit<Services, keyof SingletonServices | keyof VrameworkInteraction>>

export type VrameworkQuery<T = unknown> = Record<
  string,
  string | T | null | Array<T | null>
>
