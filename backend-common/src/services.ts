import { CoreConfig } from './config'
import { Logger as PinoLogger } from 'pino'
import { DatabasePostgresPool } from './services/database/database-postgres-pool'
import { DatabasePostgres } from './services/database/database-postgres'

export interface JWTService {
  getJWTSecret: Function
  getUserSession: Function
}

export interface CoreServices {
  config: CoreConfig
  logger: PinoLogger
  jwt: JWTService
  databasePool: DatabasePostgresPool
  database: DatabasePostgres<string>
}
