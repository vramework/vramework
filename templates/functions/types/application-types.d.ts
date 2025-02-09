import type {
  CoreConfig,
  CoreServices,
  CoreSingletonServices,
  CoreUserSession,
} from '@pikku/core'

export type Config = CoreConfig
export type UserSession = CoreUserSession
export type SingletonServices = CoreSingletonServices<Config, UserSession>
export type Services = CoreServices<SingletonServices>
