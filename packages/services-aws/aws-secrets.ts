import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'
import { AWSConfig } from './aws-config'
import { SecretService } from '@vramework/core/types'

export class AWSSecrets implements SecretService {
  private readonly client: SecretsManagerClient

  constructor(readonly config: AWSConfig) {
    this.client = new SecretsManagerClient({ region: config.awsRegion })
  }

  public async getSecret<Result = string>(SecretId: string): Promise<Result> {
    try {
      const result = await this.client.send(new GetSecretValueCommand({ SecretId }))
      if (result.SecretString) {
        try {
          return JSON.parse(result.SecretString)
        } catch {
          return result.SecretString as any
        }
      }
    } catch (e: any) {
      console.error(e)
    }
    throw `FATAL: Error finding secret: ${SecretId}`
  }
}
