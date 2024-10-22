/**
 * Base class for custom errors.
 * @extends {Error}
 */
export class EError extends Error {
  /**
   * Creates an instance of EError.
   * @param message - The error message.
   * @param errorId - An optional error ID.
   */
  constructor(
    message?: string,
    public errorId?: string
  ) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

/**
 * Error indicating invalid parameters.
 * @extends {EError}
 */
export class InvalidParametersError extends EError {}

/**
 * Error indicating a not implemented feature.
 * @extends {EError}
 */
export class NotImplementedError extends EError {}

/**
 * Error indicating a resource was not found.
 * @extends {EError}
 */
export class NotFoundError extends EError {}

/**
 * Error indicating a route path was not found.
 * @extends {EError}
 */
export class RouteNotFoundError extends EError {}

/**
 * Error indicating an invalid origin.
 * @extends {EError}
 */
export class InvalidOriginError extends EError {}

/**
 * Error indicating access is denied.
 * @extends {EError}
 */
export class AccessDeniedError extends EError {}

/**
 * Error indicating a missing session.
 * @extends {EError}
 */
export class MissingSessionError extends EError {}

/**
 * Error indicating an invalid session.
 * @extends {EError}
 */
export class InvalidSessionError extends EError {}

/**
 * Error indicating a lack of permissions.
 * @extends {EError}
 */
export class NotPermissionedError extends EError {}

/**
 * Error indicating an invalid hash.
 * @extends {EError}
 */
export class InvalidHashError extends EError {}

/**
 * Error indicating the maximum compute time was reached.
 * @extends {EError}
 */
export class MaxComputeTimeReachedError extends EError {}
