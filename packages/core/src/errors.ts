export class EError extends Error {
  __proto__: Error
  constructor(public errorId?: string, message?: string) {
    super(message)
    const trueProto = new.target.prototype
    // Alternatively use Object.setPrototypeOf if you have an ES6 environment.
    this.__proto__ = trueProto
  }
}

export class InvalidParametersError extends EError {}
export class NotFoundError extends EError {}
export class InvalidOriginError extends EError {}
export class AccessDeniedError extends EError {}
export class MissingSessionError extends EError {}
export class InvalidSessionError extends EError {}
export class NotPermissionedError extends EError {}
export class InvalidHashError extends EError {}

interface ErrorDetails {
  status: number
  message: string
}

const apiErrors = new Map<any, ErrorDetails>([
  [InvalidParametersError, { status: 422, message: 'Invalid Parameters' }],
  [NotFoundError, { status: 404, message: 'Not Found' }],
  [InvalidOriginError, { status: 400, message: 'Invalid Origin' }],
  [AccessDeniedError, { status: 403, message: 'Access Denied' }],
  [NotPermissionedError, { status: 403, message: 'Not permissioned' }],
  [MissingSessionError, { status: 401, message: 'Missing Session' }],
  [InvalidSessionError, { status: 401, message: 'Invalid Session' }],
])

export const addError = (error: any, { status, message }: ErrorDetails) => {
  apiErrors.set(error, { status, message })
}

export const addErrors = (errors: Array<[error: any, details: ErrorDetails]>) => {
  errors.forEach((error) => {
    addError(error[0], error[1])
  })
}

export const getErrorResponse = (error: any): { status: number; message: string } | undefined => {
  const foundError = [...apiErrors.entries()].find(([e]) => e.name === error.constructor.name)
  if (foundError) {
    return foundError[1]
  }
  return apiErrors.get(error)
}
