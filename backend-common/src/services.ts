import { CoreConfig } from './config'
import { Logger as PinoLogger } from 'pino'

export interface JWTService {
  getJWTSecret: Function
  getUserSession: Function
}

export interface CoreServices {
  config: CoreConfig
  logger: PinoLogger
  jwt: JWTService
}
