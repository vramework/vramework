import { APIRoute, Config, Services, UserSession } from "@vramework/functions/src/api";
import { PinoLogger } from "@vramework/functions/src/services/pino";

export type Logger = PinoLogger

export interface JWTService {
    getJWTSecret: Function
    getUserSession: Function
}

export interface PermissionService {
    validate: (config: Config, services: Services, route: APIRoute<unknown, unknown>, data: Record<string, any>, session: UserSession) => Promise<boolean>
}

export interface SecretService {
    getSecret: (key: string) => Promise<string>
}

export interface CoreServices {
    logger: Logger
    jwt: JWTService
    permissions: PermissionService
}
