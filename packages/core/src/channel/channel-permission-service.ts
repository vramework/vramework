import type { CoreUserSession } from '../types/core.types.js'
import { CoreAPIChannel } from './channel.types.js'

/**
 * Interface for handling permission verification.
 */
export interface ChannelPermissionService {
  /**
   * Verifies access to a channel.
   * @param route - The channel to verify access for.
   * @param session - The user session.
   * @returns A promise that resolves if access is granted.
   */
  verifyChannelAccess(
    channel: CoreAPIChannel<unknown, any>,
    session?: CoreUserSession
  ): Promise<void>
}
