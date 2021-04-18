export class EError extends Error {
    __proto__: Error
    constructor(message?: string) {
        const trueProto = new.target.prototype
        super(message)

        // Alternatively use Object.setPrototypeOf if you have an ES6 environment.
        this.__proto__ = trueProto
    }
}

export class InvalidParametersError extends EError { }
export class NotFoundError extends EError { }
export class InvalidOriginError extends EError { }
export class AccessDeniedError extends EError { }
export class MissingSession extends EError { }

interface ErrorDetails { status: number, message: string }
const apiErrors = new Map<any, ErrorDetails>([
    [InvalidParametersError, { status: 422, message: 'Invalid Parameters' }],
    [NotFoundError, { status: 404, message: 'Not Found' }],
    [InvalidOriginError, { status: 400, message: 'Invalid Origin' }],
    [AccessDeniedError, { status: 401, message: 'Access Denied' }],
])

export const addError = (error: any, { status, message }: ErrorDetails) => {
    apiErrors.set(error, { status, message })
}

export const addErrors = (errors: Array<[error: any, details: ErrorDetails]>) => {
    errors.forEach(error => {
        addError(error[0], error[1])
    })
}

export const getErrorResponse = (error: any): { status: number, message: string } | undefined => {
    return apiErrors.get(error)
}