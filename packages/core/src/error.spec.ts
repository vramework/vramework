import { expect } from 'chai'
import {
  getErrorResponse,
  addError,
} from './error-handler'
import { AccessDeniedError, InvalidParametersError, NotFoundError } from './errors'

describe('getErrorResponse', () => {
  it('should return the correct error response for InvalidParametersError', () => {
    const error = new InvalidParametersError()
    const response = getErrorResponse(error)
    expect(response).to.deep.equal({
      status: 422,
      message: 'Invalid Parameters',
    })
  })

  it('should return the correct error response for NotFoundError', () => {
    const error = new NotFoundError()
    const response = getErrorResponse(error)
    expect(response).to.deep.equal({ status: 404, message: 'Not Found' })
  })

  it('should return the correct error response for AccessDeniedError', () => {
    const error = new AccessDeniedError()
    const response = getErrorResponse(error)
    expect(response).to.deep.equal({ status: 403, message: 'Access Denied' })
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
