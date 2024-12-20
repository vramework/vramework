import type { Logger, LogLevel } from '../services/logger.js'
import type { HTTPSessionService } from '../http/http-session-service.js'
import type { HTTPPermissionService } from '../http/http-permission-service.js'
import type { VrameworkHTTPAbstractRequest } from '../http/vramework-http-abstract-request.js'
import type { VrameworkHTTPAbstractResponse } from '../http/vramework-http-abstract-response.js'
import type { ChannelPermissionService } from '../channel/channel-permission-service.js'
import { VariablesService } from '../services/variables-service.js'

/**
 * Represents a JSON primitive type which can be a string, number, boolean, null, or undefined.
 */
export type JSONPrimitive = string | number | boolean | null | undefined

/**
 * Represents a JSON value which can be a primitive, an array, or an object.
 */
export type JSONValue =
  | JSONPrimitive
  | JSONValue[]
  | {
      [key: string]: JSONValue
    }

/**
 * Utility type for making certain keys required and leaving the rest as optional.
 */
export type PickRequired<T, K extends keyof T> = Required<Pick<T, K>> &
  Partial<T>

/**
 * Utility type for making certain keys optional while keeping the rest required.
 */
export type PickOptional<T, K extends keyof T> = Partial<T> & Pick<T, K>

/**
 * Utility type that ensures at least one key in the given type `T` is required.
 */
export type RequireAtLeastOne<T> = {
  [K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>
}[keyof T]

/**
 * Interface for the core configuration settings of Vramework.
 */
export interface CoreConfig {
  /** The log level for the application. */
  logLevel: LogLevel
  /** The maximum compute time allowed, in milliseconds (optional). */
  maximumComputeTime?: number
  /** Secrets used by the application (optional). */
  secrets?: {}
}

/**
 * Represents a core user session, which can be extended for more specific session information.
 */
export interface CoreUserSession {}

/**
 * Represents request headers as either a record or a function to get headers by name.
 */
export type RequestHeaders =
  | Record<string, string | string[] | undefined>
  | ((headerName: string) => string | string[] | undefined)

/**
 * Interface for core singleton services provided by Vramework.
 */
export interface CoreSingletonServices {
  /** The session service used by the application (optional). */
  httpSessionService?: HTTPSessionService
  /** The http permission service used for authorization (optional). */
  httpPermissionService?: HTTPPermissionService
  /** The channel permission service used by the application (optional). */
  channelPermissionService?: ChannelPermissionService
  /** The core configuration for the application. */
  config: CoreConfig
  /** The logger used by the application. */
  logger: Logger
}

/**
 * Represents a http interaction within Vramework, including a request and response.
 */
export interface VrameworkHTTP {
  request?: VrameworkHTTPAbstractRequest
  response?: VrameworkHTTPAbstractResponse
}

/**
 * Represents different forms of interaction within Vramework and the outside world.
 */
export interface VrameworkInteractions {
  http?: VrameworkHTTP
}

/**
 * Represents the core services used by Vramework, including singleton services and the request/response interaction.
 */
export type CoreServices<SingletonServices = CoreSingletonServices> =
  SingletonServices & VrameworkInteractions

/**
 * Defines a function type for creating singleton services from the given configuration.
 */
export type CreateSingletonServices<
  Config extends CoreConfig,
  SingletonServices extends CoreSingletonServices,
> = (config: Config, ...args: any[]) => Promise<SingletonServices>

/**
 * Defines a function type for creating session-specific services.
 */
export type CreateSessionServices<
  SingletonServices extends CoreSingletonServices,
  UserSession extends CoreUserSession,
  Services extends CoreServices<SingletonServices>,
> = (
  services: SingletonServices,
  interaction: VrameworkInteractions,
  session: UserSession | undefined
) => Promise<
  Omit<Services, keyof SingletonServices | keyof VrameworkInteractions>
>

/**
 * Defines a function type for creating config.
 */
export type CreateConfig<Config extends CoreConfig> = (variablesService?: VariablesService) => Promise<Config>

/**
 * Represents a query object for Vramework, where each key can be a string, a value, or an array of values.
 */
export type VrameworkQuery<T = Record<string, string | undefined>> = Record<
  string,
  string | T | null | Array<T | null>
>

/**
 * Represents the documentation for a route, including summary, description, tags, and errors.
 */
export type APIDocs = {
  summary?: string
  description?: string
  tags?: string[]
  errors?: string[]
}
