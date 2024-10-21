import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager'
import { AWSConfig } from './aws-config'
import { SecretService } from '@vramework/core/services/secret-service'

export class AWSSecrets implements SecretService {
  private readonly client: SecretsManagerClient

  constructor(readonly config: AWSConfig) {
    this.client = new SecretsManagerClient({ region: config.awsRegion })
  }

  public async getSecretJSON<Result = string>(
    SecretId: string
  ): Promise<Result> {
    const secretValue = await this.getSecret(SecretId)
    return JSON.parse(secretValue)
  }

  public async getSecret<Result = string>(SecretId: string): Promise<Result> {
    try {
      const result = await this.client.send(
        new GetSecretValueCommand({ SecretId })
      )
      if (result.SecretString) {
        return result.SecretString as any
      }
    } catch (e: any) {
      console.error(e)
    }
    throw `FATAL: Error finding secret: ${SecretId}`
  }
}
