import { CoreUserSession } from '../types'
import { VrameworkRequest } from '../vramework-request'

/**
 * Interface for handling user sessions.
 * @template UserSession - The type of the user session.
 */
export interface SessionService<UserSession = CoreUserSession> {
  /**
   * Retrieves the user session.
   * @param credentialsRequired - A flag indicating whether credentials are required.
   * @param vrameworkRequest - The request object.
   * @returns A promise that resolves to the user session or undefined.
   * @description This method retrieves the user session based on the provided request and credentials requirement.
   */
  getUserSession: (
    credentialsRequired: boolean,
    vrameworkRequest: VrameworkRequest
  ) => Promise<UserSession | undefined>
}
