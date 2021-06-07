import { CoreConfig } from './config'
import { Logger as PinoLogger } from 'pino'
import { CoreUserSession } from './user-session'

export interface JWTService {
  getJWTSecret: Function
  getUserSession: Function
}

export interface CoreServices extends CoreSingletonServices {
}


export interface CoreSingletonServices {
  config: CoreConfig
  logger: PinoLogger
  jwt: JWTService
  createSessionServices: (services: CoreSingletonServices, session?: CoreUserSession) => CoreServices
}
