import {
  InvalidParametersError,
  NotFoundError,
  NotImplementedError,
  InvalidOriginError,
  AccessDeniedError,
  NotPermissionedError,
  MissingSessionError,
  InvalidSessionError,
  MaxComputeTimeReachedError,
} from './errors'

/**
 * Interface for error details.
 */
export interface ErrorDetails {
  status: number
  message: string
}

/**
 * Map of API errors to their details.
 */
const apiErrors = new Map<any, ErrorDetails>([
  [InvalidParametersError, { status: 422, message: 'Invalid Parameters' }],
  [NotFoundError, { status: 404, message: 'Not Found' }],
  [NotImplementedError, { status: 501, message: 'Not Found' }],
  [InvalidOriginError, { status: 400, message: 'Invalid Origin' }],
  [AccessDeniedError, { status: 403, message: 'Access Denied' }],
  [NotPermissionedError, { status: 403, message: 'Not permissioned' }],
  [MissingSessionError, { status: 401, message: 'Missing Session' }],
  [InvalidSessionError, { status: 401, message: 'Invalid Session' }],
  [
    MaxComputeTimeReachedError,
    { status: 408, message: 'Max compute time reached' },
  ],
])

/**
 * Adds an error to the API errors map.
 * @param error - The error to add.
 * @param details - The details of the error.
 */
export const addError = (error: any, { status, message }: ErrorDetails) => {
  apiErrors.set(error, { status, message })
}

/**
 * Adds multiple errors to the API errors map.
 * @param errors - An array of errors and their details.
 */
export const addErrors = (
  errors: Array<[error: any, details: ErrorDetails]>
) => {
  errors.forEach((error) => {
    addError(error[0], error[1])
  })
}

/**
 * Retrieves the error response for a given error.
 * @param error - The error to get the response for.
 * @returns An object containing the status and message, or undefined if the error is not found.
 */
export const getErrorResponse = (
  error: Error
): { status: number; message: string } | undefined => {
  const foundError = Array.from(apiErrors.entries()).find(
    ([e]) => e.name === error.constructor.name
  )
  if (foundError) {
    return foundError[1]
  }
  return apiErrors.get(error)
}
