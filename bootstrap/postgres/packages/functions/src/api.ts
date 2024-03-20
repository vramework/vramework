import { Logger } from 'pino'

import { CoreConfig } from '@vramework/core/dist/config'
import { CoreSingletonServices } from '@vramework/core/dist/services'
import { JWTService } from '@vramework/core/dist/services/jwt-service'
import { CoreUserSession } from '@vramework/core/dist/user-session'
import { ContentService } from '@vramework/core/dist/services'
import { LocalSecretService } from '@vramework/core/dist/services/local-secrets'
import { Kysely } from 'kysely'
import { DB } from 'kysely-codegen'

export type Config = CoreConfig & {
  awsRegion: string,
  postgres: {
    readonly user: string;
    readonly password: string;
    readonly host: string;
    readonly port: number;
    readonly database: string;
  }
}

export type UserSession = CoreUserSession & {
  isPaidMember: boolean
}

export type SingletonServices = CoreSingletonServices & {
  secrets: LocalSecretService
  content: ContentService
  logger: Logger
  jwt: JWTService<UserSession>
  config: Config
  kysley: Kysely<DB>
}

export interface Email {
    sendEmail: (args: { template: string, from: string, to: string, body: string }) => Promise<boolean>
}

export type Services = SingletonServices & {
  email: Email
  database: any
}

export type APIFunction<In, Out> = (services: Services, data: In, session: UserSession) => Promise<Out>
export type APIFunctionSessionless<In, Out> = (services: Services, data: In, session: Partial<UserSession>) => Promise<Out>

export type APIPermission<Data> = (services: Services, data: Data, session: UserSession) => Promise<boolean>

export type APIRoute<In, Out> = {
  type: 'post' | 'get' | 'delete' | 'patch' | 'head'
  route: string
  schema: string | null
  requiresSession?: undefined | true
  func: APIFunction<In, Out>,
  permissions?: Record<string, APIPermission<In>[] | APIPermission<In>>
} | {
  type: 'post' | 'get' | 'delete' | 'patch' | 'head'
  route: string
  schema: string | null
  requiresSession: false
  func: APIFunctionSessionless<In, Out>
}

export type APIRoutes = Array<APIRoute<any, any>>