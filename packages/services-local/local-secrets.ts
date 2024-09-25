import { SecretService } from '@vramework/core'

/**
 * Service for retrieving secrets from environment variables.
 * @implements {SecretService}
 */
export class LocalSecretService implements SecretService {
  /**
   * Creates an instance of LocalSecretService.
   * @description This constructor initializes the LocalSecretService instance.
   */
  constructor() {}

  /**
   * Retrieves a secret by key.
   * @param key - The key of the secret to retrieve.
   * @returns A promise that resolves to the secret value.
   * @throws {Error} If the secret is not found.
   * @description This method fetches the secret value associated with the provided key from the environment variables. If the secret is not found, it throws an error.
   */
  public async getSecret(key: string): Promise<string> {
    const value = process.env[key]
    if (value) {
      return value
    }
    throw new Error(`Secret Not Found: ${key}`)
  }
}
