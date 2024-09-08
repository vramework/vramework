import { Logger, LogLevel } from './services/logger'
import { StreamService } from './services/stream-service'
import { PermissionService } from './services/permission-service'

export type PickRequired<T, K extends keyof T> = Pick<T, K> & Partial<T>;
export type PickOptional<T, K extends keyof T> = Omit<T, K> & Partial<T>;
export type RequireAtLeastOne<T> = {
    [K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>
}[keyof T]

export interface VrameworkConfig {
    rootDir?: string,
    routeDirectories: string[],
    schemaOutputDirectory: string,
    tsconfig: string
}

export interface CoreConfig {
    logLevel: LogLevel
    port: number
    maximumComputeTime?: number
    domain?: string
    corsDomains?: string[]
    secrets?: {}
}

export interface CoreUserSession {
}

export interface ContentConfig {
    localFileUploadPath: string
    bucketName: string
    endpoint?: string
    region?: string
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
    getJWTSecret: Function
    decodeSessionAsync: (jwtToken: string, debug?: any) => Promise<UserSession>
}

export interface SessionService<UserSession = CoreUserSession> {
    getUserSession: (credentialsRequired: boolean, headers: Partial<Record<'cookie' | 'authorization' | 'apiKey', string | undefined>>, debug?: any) => Promise<UserSession | undefined>
}

export interface CoreSingletonServices {
    jwt?: JWTService
    sessionService?: SessionService
    permissionService?: PermissionService
    streamService?: StreamService
    config: CoreConfig
    logger: Logger
}

export interface CoreServices extends CoreSingletonServices {
}

export interface HTTPRequestService {
    getRawBody(): string
    getHeader(name: string): string | null
}

export interface HTTPResponseService {
    setCookie(name: string, value: string, options: any): void
}

export type CreateSingletonServices = (config: CoreConfig) => Promise<CoreSingletonServices>
export type CreateSessionServices = (services: CoreSingletonServices, session: CoreUserSession, data: any) => Promise<CoreServices>