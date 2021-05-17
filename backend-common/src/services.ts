import { CoreConfig } from './config'
import { Logger as PinoLogger } from 'pino'

export type Logger = PinoLogger

export interface JWTService {
  getJWTSecret: Function
  getUserSession: Function
}

export interface SecretService {
  getSecret: (key: string) => Promise<string>
}

export interface CoreServices {
  config: CoreConfig
  logger: PinoLogger
  jwt: JWTService
}
