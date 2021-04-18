import { CoreConfig } from "./config";
import { CoreAPIRoute } from "./routes";
import { CoreUserSession } from "./user-session";
import { Logger as PinoLogger } from 'pino'

export type Logger = any

export interface JWTService {
    getJWTSecret: Function
    getUserSession: Function
}

export interface PermissionService {
    validate: (config: CoreConfig, services: CoreServices, route: CoreAPIRoute<unknown, unknown>, data: Record<string, any>, session: CoreUserSession) => Promise<boolean>
}

export interface SecretService {
    getSecret: (key: string) => Promise<string>
}

export interface CoreServices {
    logger: PinoLogger
    jwt: JWTService
    permissions: PermissionService
}
