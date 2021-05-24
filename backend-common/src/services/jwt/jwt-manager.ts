import jwt from 'jsonwebtoken'
import { Logger } from 'pino'
import { parse as parseCookie } from 'cookie'
import { v4 as uuid } from 'uuid'
import { DatabasePostgres } from '../database/database-postgres'
import { MissingSessionError } from '../../errors'

interface Secret {
  keyid: string
  secret: string
}

export class JWTManager<S> {
  private currentSecret: Secret = { keyid: '1', secret: 'Monkey' }
  private secrets: Record<string, Secret> = {}

  constructor(private database: DatabasePostgres, private logger: Logger) {}

  public async init(): Promise<void> {
    await this.getSecrets()
  }

  private async getSecrets() {
    try {
      const result = await this.database.query<{ secret: string; keyid: string }>('SELECT * FROM app."jwt_secret"')
      this.currentSecret = result.rows[result.rows.length - 1]
      this.secrets = result.rows.reduce((result, secret) => {
        result[secret.keyid] = secret
        return result
      }, {} as Record<string, Secret>)
      this.logger.info(`Retrieved JWT secrets: ${Object.keys(this.secrets).join(',')}`)
    } catch (e) {
      this.logger.error('Error getting jwt secrets', e)
    }
  }

  public async getJWTSecret(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback): Promise<void> {
    if (header.kid) {
      if (!this.secrets[header.kid]) {
        await this.getSecrets()
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

  public async encodeJWTHash(validFor: number): Promise<{ hash: string; expiresAt: Date }> {
    const expiresIn = 1 * 24 * 60 * 60
    return new Promise((resolve, reject) => {
      const { secret, keyid } = this.currentSecret
      jwt.sign({ uuid: uuid() }, secret, { expiresIn, keyid }, (err, hash) => {
        if (err || !hash) {
          return reject(err)
        }
        return resolve({ hash, expiresAt: new Date(Date.now() + validFor) })
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

  public async encodeSessionAsync(session: S): Promise<string> {
    return new Promise((resolve, reject) => {
      const { secret, keyid } = this.currentSecret
      jwt.sign(session as any, secret, { expiresIn: '7d', keyid }, (err, jwtToken) => {
        err || !jwtToken ? reject(err) : resolve(jwtToken)
      })
    })
  }

  public async decodeSessionAsync(session?: string): Promise<S> {
    if (!session) {
      throw new MissingSessionError()
    }
    return await new Promise((resolve, reject) => {
      jwt.verify(session, this.getJWTSecret.bind(this), (err, user) => {
        if (!user) {
          return reject(new MissingSessionError())
        }
        resolve(user as never as S)
      })
    })
  }

  public async getUserSession(
    requiresSession: boolean,
    cookieName: string,
    cookieString: string | undefined,
  ): Promise<S | null> {
    try {
      this.logger.info(`Has cookie: ${cookieString}`)
      if (!cookieString) {
        throw new MissingSessionError()
      }
      const cookie = parseCookie(cookieString)
      return await this.decodeSessionAsync(cookie[cookieName])
    } catch (e) {
      if (requiresSession) {
        throw e
      }
      console.error(e)
      return null
    }
  }
}
