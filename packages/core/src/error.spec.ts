import { expect } from 'chai'
import { getErrorResponse, addError } from './error-handler.js'
import { ForbiddenError, BadRequestError, NotFoundError } from './errors.js'

describe('getErrorResponse', () => {
  it('should return the correct error response for BadRequestError', () => {
    const error = new BadRequestError()
    const response = getErrorResponse(error)
    expect(response).to.deep.equal({
      status: 400,
      message: 'The server cannot or will not process the request due to client error (e.g., malformed request syntax).',
    })
  })

  it('should return the correct error response for NotFoundError', () => {
    const error = new NotFoundError()
    const response = getErrorResponse(error)
    expect(response).to.deep.equal({ status: 404, message: 'The server cannot find the requested resource.' })
  })

  it('should return the correct error response for ForbiddenError', () => {
    const error = new ForbiddenError()
    const response = getErrorResponse(error)
    expect(response).to.deep.equal({ status: 403, message: 'The client does not have permission to access the requested resource.' })
  })

  it('should return undefined for an unknown error', () => {
    class UnknownError extends Error {}
    const error = new UnknownError()
    const response = getErrorResponse(error)
    expect(response).to.be.undefined
  })

  it('should return the correct error response for a custom error added to apiErrors', () => {
    class CustomError extends Error {}
    const customError = new CustomError()
    const customErrorDetails = { status: 400, message: 'Custom Error' }

    // Add the custom error to the apiErrors map
    addError(CustomError, customErrorDetails)

    const response = getErrorResponse(customError)
    expect(response).to.deep.equal(customErrorDetails)
  })
})
