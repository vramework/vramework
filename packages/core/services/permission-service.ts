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
   */
  verifyRouteAccess(
    route: CoreAPIRoute<unknown, unknown, any>,
    session?: CoreUserSession
  ): Promise<void>
}
