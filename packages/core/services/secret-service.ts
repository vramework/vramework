/**
 * Interface for retrieving secrets.
 */
export interface SecretService {
  /**
   * Retrieves a secret by key.
   * @param key - The key of the secret to retrieve.
   * @returns A promise that resolves to the secret value.
   */
  getSecretJSON<Return = {}>(key: string): Promise<Return>
  /**
   * Retrieves a secret by key.
   * @param key - The key of the secret to retrieve.
   * @returns A promise that resolves to the secret value.
   */
  getSecret(key: string): Promise<string>
}
