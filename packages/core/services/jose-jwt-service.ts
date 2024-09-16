import * as jose from 'jose'
import { Logger } from './logger'
import { MissingSessionError } from '../errors'
import { CoreUserSession, JWTService } from '../types'

export class JoseJWTService<UserSession extends CoreUserSession> implements JWTService {
  private currentSecret: { id: string, key: Uint8Array } | undefined
  private secrets: Record<string, Uint8Array> = {}

  constructor(
    private getSecrets: () => Promise<Array<{ id: string, value: string }>>,
    private logger?: Logger,
  ) {
  }

  public async init() {
    const secrets = await this.getSecrets()
    this.secrets = secrets.reduceRight((result, secret) => {
      result[secret.id] = new TextEncoder().encode(secret.value)
      this.currentSecret = { id: secret.id, key: result[secret.id] }
      return result
    }, {} as Record<string, Uint8Array>)
    this.logger?.info(`Retrieved JWT secrets: ${Object.keys(this.secrets).join(',')}`)
  }

  public async encode<T>(expiresIn: string, payload: T): Promise<string> {
    if (!this.currentSecret) {
      await this.init()
    }
    return await new jose.SignJWT(payload as any)
      .setProtectedHeader({ alg: 'HS256', kid: this.currentSecret!.id })
      .setIssuedAt()
      // .setIssuer('urn:example:issuer')
      // .setAudience('urn:example:audience')
      .setExpirationTime(expiresIn)
      .sign(this.currentSecret!.key)
  }

  public async decode<T>(token: string): Promise<T> {
    const secret = await this.getSecret(token)
    return await jose.jwtVerify(token, secret, {}) as unknown as T
  }

  public async verify(token: string): Promise<void> {
    const secret = await this.getSecret(token)
    await jose.jwtVerify(token, secret)
  }

  public async decodeSession(session?: string): Promise<UserSession> {
    if (!session) {
      throw new MissingSessionError()
    }
    const userSession: any = await this.decode<UserSession>(session)
    return userSession.payload
  }

  private async getSecret(token: string): Promise<Uint8Array> {
    const protectedHeader = jose.decodeProtectedHeader(token)
    const keyId = protectedHeader.kid
    if (!keyId) {
      throw new Error('Missing secret keyid on token')
    }
    if (!this.secrets[keyId]) {
      await this.init()
    }
    const key = this.secrets[keyId]
    if (!key) {
      throw new Error(`Missing secret for id: ${keyId}`)
    }
    return this.secrets[keyId]
  }
}