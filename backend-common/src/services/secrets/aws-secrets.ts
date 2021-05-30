import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'
import { CoreConfig } from '../../config'
import { Logger as PinoLogger } from 'pino'

export class AWSSecrets {
  private readonly client: SecretsManagerClient

  constructor(private readonly config: CoreConfig, private readonly logger: PinoLogger) {
    this.client = new SecretsManagerClient({ region: config.awsRegion })
  }

  public async getPostgresCredentials(): Promise<{ password: string, user: string, host: string, port: number, database: string }> {
    if (process.env.NODE_ENV === 'production' || process.env.PRODUCTION_SERVICES) {
      const { password, ...rest } = await this.getSecret<{ password: string, user: string, host: string, port: number, database: string }>(this.config.secrets.postgresCredentials)
      return { password, ...rest }
    } else {
      return {
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'password',
        database: this.config.sql.database
      }
    }
  }

  public async getSecret<Result = string>(SecretId: string): Promise<Result> {
    try {
      const result = await this.client.send(new GetSecretValueCommand({ SecretId }))
      if (result.SecretString) {
        try {
          return JSON.parse(result.SecretString)
        } catch (e) {
          return result.SecretString as any
        }
      }
    } catch (e) {
      this.logger.error(`FATAL: Error finding secret ${SecretId}`)
    }
    throw 'FATAL: Error finding secret!'
  }
}
