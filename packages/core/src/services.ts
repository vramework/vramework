import { CoreConfig } from './config'
import { Logger as PinoLogger } from 'pino'
import { CoreUserSession } from './user-session'

export interface AuthenticationService<UserSession> {
  signup: (data: { 
    googleToken?: string
    email?: string
    password?: string 
  }) => Promise<{ userId: string }>
  login: (data: { 
    googleToken?: string 
    username?: string 
    password?: string 
  }) => Promise<UserSession>
  refreshSession: (refreshToken: string) => Promise<UserSession>
  updateUser: (userId: string, meta: Record<string, string | number | boolean>) => Promise<void>
  deleteUser: (userId: string) => Promise<void>

  forgotPassword: (username: string) => Promise<void>
  resetPasswordViaOTP: (username: string, password: string, resetPasswordViaOTP: string) => Promise<void>

  getSessionForAPIKey: (apiKey: string) => Promise<UserSession>
  decodeSession: (session: string) => Promise<UserSession>
}

export interface ContentService {
  signContentKey: (contentKey: string) => Promise<string>
  signURL: (url: string) => Promise<string>
  getUploadURL: (fileKey: string, contentType: string) => Promise<{ uploadUrl: string; assetKey: string }>
  deleteFile: (fileName: string) => Promise<boolean>
  writeFile: (assetKey: string, buffer: Buffer) => Promise<boolean>
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

export interface CoreServices extends CoreSingletonServices {
}


export interface CoreSingletonServices {
  config: CoreConfig
  logger: PinoLogger
  jwt: JWTService
  sessionService: SessionService
  createSessionServices: (services: CoreSingletonServices, headers: Record<string, any>, session?: CoreUserSession) => CoreServices
}
