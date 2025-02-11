import { CoreUserSession } from '../types/core.types.js'

export interface UserSessionService<UserSession extends CoreUserSession> {
  setSession: (session: UserSession) => Promise<void> | void
  deleteSession: () => Promise<void> | void
  getSession: () => Promise<UserSession | void> | UserSession | void
}
