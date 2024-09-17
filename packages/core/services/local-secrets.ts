import { Logger } from './logger'
import { SecretService } from '../types'

export class LocalSecretService implements SecretService {
  constructor(private readonly logger: Logger) {}

  public async getSecret(key: string): Promise<string> {
    const value = process.env[key]
    if (value) {
      return value
    }
    this.logger.error(`Secret Not Found: ${key}`)
    return ''
  }
}
