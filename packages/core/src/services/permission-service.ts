import type { CoreHTTPFunctionRoute } from '../http/http-routes.types.js'
import type { CoreUserSession } from '../types/core.types.js'

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
    route: CoreHTTPFunctionRoute<unknown, unknown, any>,
    session?: CoreUserSession
  ): Promise<void>
}
