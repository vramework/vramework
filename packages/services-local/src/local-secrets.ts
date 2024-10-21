import { SecretService } from '@vramework/core/services/secret-service'

/**
 * Service for retrieving secrets from environment variables.
 * @implements {SecretService}
 */
export class LocalSecretService implements SecretService {
  /**
   * Creates an instance of LocalSecretService.
   */
  constructor() {}

  /**
   * Retrieves a secret by key.
   * @param key - The key of the secret to retrieve.
   * @returns A promise that resolves to the secret value.
   * @throws {Error} If the secret is not found.
   */
  public async getSecretJSON<R>(key: string): Promise<R> {
    const value = process.env[key]
    if (value) {
      return JSON.parse(value)
    }
    throw new Error(`Secret Not Found: ${key}`)
  }

  /**
   * Retrieves a secret by key.
   * @param key - The key of the secret to retrieve.
   * @returns A promise that resolves to the secret value.
   * @throws {Error} If the secret is not found.
   */
  public async getSecret(key: string): Promise<string> {
    const value = process.env[key]
    if (value) {
      return value
    }
    throw new Error(`Secret Not Found: ${key}`)
  }
}
