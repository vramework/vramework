import { expect } from 'chai'
import { getErrorResponse, addError } from './error-handler.js'
import {
  ForbiddenError,
  BadRequestError,
  NotFoundError,
} from './errors.js'

describe('getErrorResponse', () => {
  it('should return the correct error response for BadRequestError', () => {
    const error = new BadRequestError()
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

  it('should return the correct error response for ForbiddenError', () => {
    const error = new ForbiddenError()
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
