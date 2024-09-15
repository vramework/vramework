import { Logger, LogLevel } from './services/logger'
import { CoreAPIRoute } from './routes';
import { VrameworkRequest } from './vramework-request';
import { VrameworkResponse } from './vramework-response';

export type JSONPrimitive = string | number | boolean | null | undefined;

export type JSONValue = JSONPrimitive | JSONValue[] | {
    [key: string]: JSONValue;
};

export type PickRequired<T, K extends keyof T> = Pick<T, K> & Partial<T>;
export type PickOptional<T, K extends keyof T> = Omit<T, K> & Partial<T>;
export type RequireAtLeastOne<T> = {
    [K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>
}[keyof T]

export interface VrameworkConfig {
    rootDir: string,
    routeDirectories: string[],
    vrameworkTypesModule: string,
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
    assetsUrl: string
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
    getUserSession: (credentialsRequired: boolean, vrameworkRequest: VrameworkRequest) => Promise<UserSession | undefined>
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
    request: VrameworkRequest
    response: VrameworkResponse
}

export type CreateSingletonServices = (config: CoreConfig) => Promise<CoreSingletonServices>

export type CreateSessionServices = (
    services: CoreSingletonServices, 
    session: CoreUserSession | undefined, 
    request: VrameworkRequest, 
    response: VrameworkResponse
) => Promise<CoreServices>

export type VrameworkQuery<T = unknown> = Record<string, string | T | null | Array<T | null>>