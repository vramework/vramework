import { CoreUserSession } from '../types/core.types.js'
import { VrameworkHTTPAbstractRequest } from './vramework-http-abstract-request.js'

/**
 * Interface for handling user sessions.
 * @template UserSession - The type of the user session.
 */
export interface HTTPSessionService<UserSession = CoreUserSession> {
  /**
   * Retrieves the user session.
   * @param credentialsRequired - A flag indicating whether credentials are required.
   * @param vrameworkRequest - The request object.
   * @returns A promise that resolves to the user session or undefined.
   */
  getUserSession: (
    credentialsRequired: boolean,
    vrameworkRequest: VrameworkHTTPAbstractRequest
  ) => Promise<UserSession | undefined>
}
