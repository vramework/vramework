import { CoreUserSession } from '../types'

/**
 * Interface for handling JSON Web Tokens (JWT).
 * @template UserSession - The type of the user session.
 */
export interface JWTService<UserSession = CoreUserSession> {
  /**
   * Encodes a payload into a JWT.
   * @param expiresIn - The expiration time of the token.
   * @param payload - The payload to encode.
   * @returns A promise that resolves to the encoded JWT.
   * @description This method generates a JWT for the provided payload with the specified expiration time.
   */
  encode: <T extends any>(expiresIn: string, payload: T) => Promise<string>

  /**
   * Decodes a JWT into its payload.
   * @param hash - The JWT to decode.
   * @param invalidHashError - An optional error to throw if the hash is invalid.
   * @param debug - An optional flag for debugging.
   * @returns A promise that resolves to the decoded payload.
   * @description This method decodes the provided JWT and returns its payload. It can optionally throw an error if the hash is invalid and provide debugging information.
   */
  decode: <T>(
    hash: string,
    invalidHashError?: Error,
    debug?: boolean
  ) => Promise<T>

  /**
   * Decodes a user session from a JWT.
   * @param jwtToken - The JWT representing the user session.
   * @param debug - An optional flag for debugging.
   * @returns A promise that resolves to the decoded user session.
   * @description This method decodes the provided JWT and returns the user session it represents. It can optionally provide debugging information.
   */
  decodeSession: (jwtToken: string, debug?: any) => Promise<UserSession>
}
