import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'
import { AWSConfig } from './aws-config'

export class AWSSecrets {
  private readonly client: SecretsManagerClient

  constructor(readonly config: AWSConfig) {
    this.client = new SecretsManagerClient({ region: config.awsRegion })
  }

  public async getPostgresCredentials(postgresSecretName: string, database: string): Promise<{ password: string, user: string, host: string, port: number, database: string }> {
    if (process.env.NODE_ENV === 'production' || process.env.PRODUCTION_SERVICES) {
      const { password, ...rest } = await this.getSecret<{ password: string, user: string, host: string, port: number, database: string }>(postgresSecretName)
      return { password, ...rest, database }
    } else {
      return {
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'password',
        database
      }
    }
  }

  public async getSecret<Result = string>(SecretId: string): Promise<Result> {
    try {
      const result = await this.client.send(new GetSecretValueCommand({ SecretId }))
      if (result.SecretString) {
        try {
          return JSON.parse(result.SecretString)
        } catch (e: any) {
          return result.SecretString as any
        }
      }
    } catch (e: any) {
      console.error(e)
    }
    throw `FATAL: Error finding secret: ${SecretId}`
  }
}
