import { addError, EError } from './error-handler.js'

/**
 * The server cannot or will not process the request due to client error (e.g., malformed request syntax).
 */
export class BadRequestError extends EError {}
addError(BadRequestError, {
  status: 400,
  message:
    'The server cannot or will not process the request due to client error (e.g., malformed request syntax).',
})

/**
 * Authentication is required and has failed or has not yet been provided.
 */
export class UnauthorizedError extends EError {}
export class MissingSessionError extends EError {}
export class InvalidSessionError extends EError {}

addError(UnauthorizedError, {
  status: 401,
  message:
    'Authentication is required and has failed or has not yet been provided.',
})
addError(MissingSessionError, { status: 401, message: 'Session missing.' })
addError(InvalidSessionError, {
  status: 401,
  message: 'The session provided is not valid.',
})

/**
 * Reserved for future use, often related to digital payment or subscription services.
 */
export class PaymentRequiredError extends EError {}
addError(PaymentRequiredError, {
  status: 402,
  message:
    'Reserved for future use, often related to digital payment or subscription services.',
})

/**
 * The client does not have permission to access the requested resource.
 */
export class ForbiddenError extends EError {}
addError(ForbiddenError, {
  status: 403,
  message:
    'The client does not have permission to access the requested resource.',
})

/**
 * The request was made from an origin that is not permitted to access this resource.
 */
export class InvalidOriginError extends EError {}
addError(InvalidOriginError, {
  status: 403,
  message:
    'The request was made from an origin that is not permitted to access this resource.',
})

/**
 * The server cannot find the requested resource.
 */
export class NotFoundError extends EError {}
export class RouteNotFoundError extends EError {}
addError(NotFoundError, {
  status: 404,
  message: 'The server cannot find the requested resource.',
})
addError(RouteNotFoundError, {
  status: 404,
  message: 'The server cannot find the requested resource.',
})

/**
 * The request method is known by the server but is not supported by the resource.
 */
export class MethodNotAllowedError extends EError {}
addError(MethodNotAllowedError, {
  status: 405,
  message:
    'The request method is known by the server but is not supported by the resource.',
})

/**
 * The requested resource cannot produce a response matching the list of acceptable values in the request's headers.
 */
export class NotAcceptableError extends EError {}
addError(NotAcceptableError, {
  status: 406,
  message:
    "The requested resource cannot produce a response matching the list of acceptable values in the request's headers.",
})

/**
 * The client must authenticate itself to get the requested response.
 */
export class ProxyAuthenticationRequiredError extends EError {}
addError(ProxyAuthenticationRequiredError, {
  status: 407,
  message: 'The client must authenticate itself to get the requested response.',
})

/**
 * The server did not receive a timely response from an upstream server.
 */
export class RequestTimeoutError extends EError {}
addError(RequestTimeoutError, {
  status: 408,
  message:
    'The server did not receive a timely response from an upstream server.',
})

/**
 * The request could not be completed due to a conflict with the current state of the target resource.
 */
export class ConflictError extends EError {}
addError(ConflictError, {
  status: 409,
  message:
    'The request could not be completed due to a conflict with the current state of the target resource.',
})

/**
 * The resource that is being accessed is no longer available and will not be available again.
 */
export class GoneError extends EError {}
addError(GoneError, {
  status: 410,
  message:
    'The resource that is being accessed is no longer available and will not be available again.',
})

/**
 * The request did not specify the length of its content, which is required by the requested resource.
 */
export class LengthRequiredError extends EError {}
addError(LengthRequiredError, {
  status: 411,
  message:
    'The request did not specify the length of its content, which is required by the requested resource.',
})

/**
 * The server does not meet one of the preconditions that the requester put on the request.
 */
export class PreconditionFailedError extends EError {}
addError(PreconditionFailedError, {
  status: 412,
  message:
    'The server does not meet one of the preconditions that the requester put on the request.',
})

/**
 * The request is larger than the server is willing or able to process.
 */
export class PayloadTooLargeError extends EError {}
addError(PayloadTooLargeError, {
  status: 413,
  message:
    'The request is larger than the server is willing or able to process.',
})

/**
 * The URI requested by the client is longer than the server is willing to interpret.
 */
export class URITooLongError extends EError {}
addError(URITooLongError, {
  status: 414,
  message:
    'The URI requested by the client is longer than the server is willing to interpret.',
})

/**
 * The server does not support the media format of the requested data.
 */
export class UnsupportedMediaTypeError extends EError {}
addError(UnsupportedMediaTypeError, {
  status: 415,
  message:
    'The server does not support the media format of the requested data.',
})

/**
 * The client has asked for a portion of the file, but the server cannot supply that portion.
 */
export class RangeNotSatisfiableError extends EError {}
addError(RangeNotSatisfiableError, {
  status: 416,
  message:
    'The client has asked for a portion of the file, but the server cannot supply that portion.',
})

/**
 * The server cannot meet the requirements of the Expect request-header field.
 */
export class ExpectationFailedError extends EError {}
addError(ExpectationFailedError, {
  status: 417,
  message:
    'The server cannot meet the requirements of the Expect request-header field.',
})

/**
 * The user has sent too many requests in a given amount of time ("rate limiting").
 */
export class TooManyRequestsError extends EError {}
addError(TooManyRequestsError, {
  status: 429,
  message:
    'The user has sent too many requests in a given amount of time ("rate limiting").',
})

/**
 * A generic error message, given when no more specific message is suitable.
 */
export class InternalServerError extends EError {}
addError(InternalServerError, {
  status: 500,
  message:
    'A generic error message, given when no more specific message is suitable.',
})

/**
 * The server does not recognize the request method and cannot support it.
 */
export class NotImplementedError extends EError {}
addError(NotImplementedError, {
  status: 501,
  message:
    'The server does not recognize the request method and cannot support it.',
})

/**
 * The server was acting as a gateway or proxy and received an invalid response from the upstream server.
 */
export class BadGatewayError extends EError {}
addError(BadGatewayError, {
  status: 502,
  message:
    'The server was acting as a gateway or proxy and received an invalid response from the upstream server.',
})

/**
 * The server is currently unavailable (overloaded or down).
 */
export class ServiceUnavailableError extends EError {}
addError(ServiceUnavailableError, {
  status: 503,
  message: 'The server is currently unavailable (overloaded or down).',
})

/**
 * The server was acting as a gateway or proxy and did not receive a timely response from the upstream server.
 */
export class GatewayTimeoutError extends EError {}
addError(GatewayTimeoutError, {
  status: 504,
  message:
    'The server was acting as a gateway or proxy and did not receive a timely response from the upstream server.',
})

/**
 * The server does not support the HTTP protocol version used in the request.
 */
export class HTTPVersionNotSupportedError extends EError {}
addError(HTTPVersionNotSupportedError, {
  status: 505,
  message:
    'The server does not support the HTTP protocol version used in the request.',
})

/**
 * The server took too long to complete the request, reaching the maximum compute time allowed.
 */
export class MaxComputeTimeReachedError extends EError {}
addError(MaxComputeTimeReachedError, {
  status: 524,
  message:
    'The server took too long to complete the request, reaching the maximum compute time allowed.',
})
