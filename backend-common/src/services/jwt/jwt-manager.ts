import * as jwt from 'jsonwebtoken'
import { v4 as uuid } from 'uuid'
import { Logger } from 'pino'
import { InvalidHashError, InvalidSessionError, MissingSessionError } from '../../errors'

interface Secret {
  keyid: string
  secret: string
}

export class JWTManager<UserSession extends Object> {
  private currentSecret: Secret = { keyid: '1', secret: 'Monkey' }
  private secrets: Record<string, Secret> = {}

  constructor(private getSecrets: () => Promise<Secret[]>, private logger: Logger) {
  }

  public async init () {
    const secrets = await this.getSecrets()
    this.currentSecret = secrets[secrets.length - 1]
    this.secrets = secrets.reduce((result, secret) => {
      result[secret.keyid] = secret
      return result
    }, {} as Record<string, Secret>)
    this.logger.info(`Retrieved JWT secrets: ${Object.keys(this.secrets).join(',')}`)
  }

  public async getJWTSecret(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
    if (header.kid) {
      if (!this.secrets[header.kid]) {
        await this.init()
      }
      const key = this.secrets[header.kid]
      if (key) {
        callback(null, key.secret)
      } else {
        callback(`Missing secret keyid on db: ${header.kid}`)
      }
    } else {
      callback('Missing secret keyid on token')
    }
  }

  public async encodeJWTHash(expiresIn: number, payload?: Record<string, string>): Promise<{ hash: string; expiresAt: Date }> {
    return new Promise((resolve, reject) => {
      const { secret, keyid } = this.currentSecret
      jwt.sign({ ...payload, uuid: uuid() }, secret, { expiresIn, keyid }, (err, hash) => {
        if (err || !hash) {
          return reject(err)
        }
        return resolve({ hash, expiresAt: new Date(Date.now() + expiresIn) })
      })
    })
  }

  public async decodeJWTHash<T = never>(hash: string, invalidHashError: any): Promise<{ uuid: string } & T> {
    try {
      await this.verifyJWTHash(hash, )
    } catch (e) {
      throw invalidHashError
    }
    return await new Promise((resolve, reject) => {
      jwt.verify(hash, this.getJWTSecret.bind(this), (err, data) => {
        if (!data) {
          return reject(new InvalidHashError())
        }
        resolve(data as any)
      })
    })
  }

  public async verifyJWTHash(hash: string): Promise<void> {
    return new Promise((resolve, reject) => {
      jwt.verify(hash, this.getJWTSecret.bind(this), (err, hash) => {
        if (err || !hash) {
          return reject(err)
        }
        return resolve()
      })
    })
  }

  public async encodeSessionAsync(session: UserSession): Promise<string> {
    return new Promise((resolve, reject) => {
      const { secret, keyid } = this.currentSecret
      jwt.sign(session, secret, { expiresIn: '1d', keyid }, (err, jwt) => {
        err ? reject(err) : resolve(jwt!)
      })
    })
  }

  public async decodeSessionAsync(session?: string): Promise<UserSession> {
    if (!session) {
      throw new MissingSessionError()
    }
    return await new Promise((resolve, reject) => {
      jwt.verify(session, this.getJWTSecret.bind(this), (err, user) => {
        if (!user) {
          return reject(new InvalidSessionError())
        }
        resolve(user as UserSession)
      })
    })
  }
}