import { Logger, LogLevel } from './services/logger'
import { StreamService } from './services/stream-service'
import { PermissionService } from './services/permission-service'

export interface VrameworkConfig {
    rootDir?: string,
    routeDirectories: string[],
    schemaOutputDirectory: string,
    tsconfig: string
}

export interface CoreConfig {
    domain: string
    corsDomains?: string[]
    maximumComputeTime?: number
    secrets: {}
    server: {
      port: number
    }
    logger: {
      level: LogLevel
    }
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
    getCookieName: (headers: Record<string, string>) => string
}

export interface CoreSingletonServices {
    permissionService?: PermissionService
    streamService?: StreamService
    config: CoreConfig
    logger: Logger
    jwt: JWTService
    sessionService: SessionService
}

export interface CoreServices extends CoreSingletonServices {
}

export interface HTTPRequestService {
    getRawBody(): string
    getHeader(name: string): string | null
}

export type CreateSingletonServices = (config: CoreConfig) => Promise<CoreSingletonServices>
export type CreateHTTPSessionServices = (services: CoreSingletonServices, session: CoreUserSession, data: any) => Promise<CoreServices>