import { CoreAPIRoute } from '../types/routes.types'
import { CoreUserSession } from '../types/core.types'

/**
 * Interface for handling permission verification.
 */
export interface PermissionService {
  /**
   * Verifies access to a route.
   * @param route - The route to verify access for.
   * @param session - The user session.
   * @returns A promise that resolves if access is granted.
   * @description This method checks if the provided user session has the necessary permissions to access the specified route.
   */
  verifyRouteAccess(
    route: CoreAPIRoute<unknown, unknown, any>,
    session?: CoreUserSession
  ): Promise<void>
}
