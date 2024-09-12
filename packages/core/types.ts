import { Logger, LogLevel } from './services/logger'
import { CoreAPIRoute } from './routes';

export type PickRequired<T, K extends keyof T> = Pick<T, K> & Partial<T>;
export type PickOptional<T, K extends keyof T> = Omit<T, K> & Partial<T>;
export type RequireAtLeastOne<T> = {
    [K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>
}[keyof T]

export interface VrameworkConfig {
    rootDir: string,
    routeDirectories: string[],
    routesOutputFile?: string,
    schemaOutputDirectory: string,
    tsconfig: string
}

export interface SecretService {
    getSecret(key: string): Promise<string>
}

export interface CoreConfig {
    logLevel: LogLevel
    port: number
    maximumComputeTime?: number
    healthCheckPath?: string
    secrets?: {}
    content?: CoreContentConfig
    limits?: Partial<Record<string, string>>
}

export interface CoreUserSession {
}

export interface LocalContentConfig {
    contentDirectory: string
    fileUploadLimit?: number
    assetsUrl?: string
    uploadUrl?: string
}

export interface CoreContentConfig {
  local?: LocalContentConfig
}

export interface ContentService {
    signContentKey: (contentKey: string) => Promise<string>
    signURL: (url: string) => Promise<string>
    getUploadURL: (fileKey: string, contentType: string) => Promise<{ uploadUrl: string; assetKey: string }>
    deleteFile: (fileName: string) => Promise<boolean>
    writeFile: (assetKey: string, buffer: Buffer) => Promise<boolean>
    copyFile: (assetKey: string, fromAbsolutePath: string) => Promise<boolean>
    readFile: (assetKey: string) => Promise<Buffer>
}

export interface JWTService<UserSession = CoreUserSession> {
    decodeSessionAsync: (jwtToken: string, debug?: any) => Promise<UserSession>
}

export type RequestHeaders = Record<string, string | string[] | undefined> | ((headerName: string) => string | string[] | undefined)

export interface SessionService<UserSession = CoreUserSession> {
    getUserSession: (credentialsRequired: boolean, headers: RequestHeaders) => Promise<UserSession | undefined>
}

export interface PermissionService {
    verifyRouteAccess (route: CoreAPIRoute<unknown, unknown>, session?: CoreUserSession): Promise<void>;
}

export interface CoreSingletonServices {
    jwt?: JWTService
    sessionService?: SessionService
    permissionService?: PermissionService
    config: CoreConfig
    logger: Logger
}

export interface CoreServices extends CoreSingletonServices {
}

export interface CoreHTTPServices extends CoreServices {
    httpRequest: HTTPRequestService
    httpResponse: HTTPResponseService
}

export interface HTTPRequestService {
    getRawBody(): string
    getHeader(name: string): string | null
}

export interface HTTPResponseService {
    setCookie(name: string, value: string, options: unknown): void
}

export type CreateSingletonServices = (config: CoreConfig) => Promise<CoreSingletonServices>
export type CreateSessionServices = (services: CoreSingletonServices, session: CoreUserSession | undefined, data: any) => Promise<CoreServices>