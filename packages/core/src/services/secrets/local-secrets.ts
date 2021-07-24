import { Logger } from 'pino'
import { CoreConfig } from '../../config'

export class LocalSecretService {
  constructor(_config: CoreConfig, private readonly logger: Logger) {}

  public async getSecret(key: string): Promise<string> {
    const value = process.env[key]
    if (value) {
      return value
    }
    this.logger.error(`Secret Not Found: ${key}`)
    return ''
  }
}
