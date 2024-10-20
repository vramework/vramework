/**
 * Interface for retrieving secrets.
 */
export interface SecretService {
  /**
   * Retrieves a secret by key.
   * @param key - The key of the secret to retrieve.
   * @returns A promise that resolves to the secret value.
   * @description This method fetches the secret value associated with the provided key.
   */
  getSecretJSON<Return = {}>(key: string): Promise<Return>
  /**
   * Retrieves a secret by key.
   * @param key - The key of the secret to retrieve.
   * @returns A promise that resolves to the secret value.
   * @description This method fetches the secret value associated with the provided key.
   */
  getSecret(key: string): Promise<string>
}
