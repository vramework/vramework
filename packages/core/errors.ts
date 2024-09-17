export class EError extends Error {
  constructor(message?: string, public errorId?: string) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class InvalidParametersError extends EError {}
export class NotImplementedError extends EError {}
export class NotFoundError extends EError {}
export class InvalidOriginError extends EError {}
export class AccessDeniedError extends EError {}
export class MissingSessionError extends EError {}
export class InvalidSessionError extends EError {}
export class NotPermissionedError extends EError {}
export class InvalidHashError extends EError {}
export class MaxComputeTimeReachedError extends EError {}

interface ErrorDetails {
  status: number
  message: string
}

const apiErrors = new Map<any, ErrorDetails>([
  [InvalidParametersError, { status: 422, message: 'Invalid Parameters' }],
  [NotFoundError, { status: 404, message: 'Not Found' }],
  [NotImplementedError, { status: 501, message: 'Not Found' }],
  [InvalidOriginError, { status: 400, message: 'Invalid Origin' }],
  [AccessDeniedError, { status: 403, message: 'Access Denied' }],
  [NotPermissionedError, { status: 403, message: 'Not permissioned' }],
  [MissingSessionError, { status: 401, message: 'Missing Session' }],
  [InvalidSessionError, { status: 401, message: 'Invalid Session' }],
  [MaxComputeTimeReachedError, { status: 408, message: 'Max compute time reached' }]
])

export const addError = (error: any, { status, message }: ErrorDetails) => {
  apiErrors.set(error, { status, message })
}

export const addErrors = (errors: Array<[error: any, details: ErrorDetails]>) => {
  errors.forEach((error) => {
    addError(error[0], error[1])
  })
}

export const getErrorResponse = (error: Error): { status: number; message: string } | undefined => {
  const foundError = Array.from(apiErrors.entries()).find(([e]) => e.name === error.constructor.name)
  if (foundError) {
    return foundError[1]
  }
  return apiErrors.get(error)
}
