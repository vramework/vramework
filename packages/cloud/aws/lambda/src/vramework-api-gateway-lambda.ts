import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { InvalidOriginError } from '@vramework/core/errors'
import {
  CoreConfig,
  CoreServices,
  CoreSingletonServices,
  CoreUserSession,
  CreateSessionServices,
} from '@vramework/core'
import {
  runHTTPRoute,
  CoreHTTPFunctionRoutes,
  HTTPRoutesMeta,
} from '@vramework/core/http'
import { Logger } from '@vramework/core/services'
import { VrameworkAPIGatewayLambdaRequest } from './vramework-api-gateway-lambda-request.js'
import { VrameworkAPIGatewayLambdaResponse } from './vramework-api-gateway-lambda-response.js'

const validateOrigin = (
  allowsOrigins: string[],
  logger: Logger,
  event: APIGatewayProxyEvent
): string => {
  const origin = event.headers.origin
  if (!origin || allowsOrigins.every((domain) => !origin.includes(domain))) {
    logger.error(`
CORS Error
  - Recieved from origin: ${origin}
  - Expected domain(s): ${allowsOrigins.join(', ')}
  - Host: ${event.headers.host}
  - Path: ${event.path}
  - Headers: ${JSON.stringify(event.headers, null, '\t')}
`)
    throw new InvalidOriginError()
  }

  return origin
}

const generalHandler = async (
  singletonServices: CoreSingletonServices,
  createSessionServices: CreateSessionServices<
    CoreSingletonServices,
    CoreUserSession,
    CoreServices
  >,
  routes: CoreHTTPFunctionRoutes,
  routesMeta: HTTPRoutesMeta,
  request: VrameworkAPIGatewayLambdaRequest,
  response: VrameworkAPIGatewayLambdaResponse
): Promise<APIGatewayProxyResult> => {
  if (request.getMethod() === 'options') {
    response.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'
    )
    response.setHeader(
      'Access-Control-Allow-Methods',
      'OPTIONS,DELETE,GET,HEAD,PATCH,POST,PUT'
    )
    response.setStatus(200)
    response.setJson({})
    return response.getLambdaResponse()
  }

  if (request.getPath().includes('health-check')) {
    response.setStatus(200)
    return response.getLambdaResponse()
  }

  try {
    await runHTTPRoute({
      request,
      response,
      singletonServices,
      createSessionServices,
      route: request.getPath(),
      method: request.getMethod() as any,
    })
  } catch {
    // Error should have already been handled by runHTTPRoute
  }

  return response.getLambdaResponse()
}

export const processCorsless = async (
  event: APIGatewayProxyEvent,
  routes: CoreHTTPFunctionRoutes,
  routesMeta: HTTPRoutesMeta,
  config: CoreConfig,
  singletonServices: CoreSingletonServices,
  createSessionServices: CreateSessionServices<
    CoreSingletonServices,
    CoreUserSession,
    CoreServices
  >
) => {
  const request = new VrameworkAPIGatewayLambdaRequest(event)
  const response = new VrameworkAPIGatewayLambdaResponse()
  return await generalHandler(
    singletonServices,
    createSessionServices,
    routes,
    routesMeta,
    request,
    response
  )
}

export const processFromAnywhereCors = async (
  event: APIGatewayProxyEvent,
  routes: CoreHTTPFunctionRoutes,
  routesMeta: HTTPRoutesMeta,
  singletonServices: CoreSingletonServices,
  createSessionServices: CreateSessionServices<
    CoreSingletonServices,
    CoreUserSession,
    CoreServices
  >
) => {
  const request = new VrameworkAPIGatewayLambdaRequest(event)
  const response = new VrameworkAPIGatewayLambdaResponse()
  if (event.headers.origin) {
    response.setHeader(
      'Access-Control-Allow-Origin',
      event.headers.origin.toString()
    )
  }
  response.setHeader('Access-Control-Allow-Credentials', true)
  return await generalHandler(
    singletonServices,
    createSessionServices,
    routes,
    routesMeta,
    request,
    response
  )
}

export const processCors = async (
  event: APIGatewayProxyEvent,
  allowedOrigins: string[],
  routes: CoreHTTPFunctionRoutes,
  routesMeta: HTTPRoutesMeta,
  singletonServices: CoreSingletonServices,
  createSessionServices: CreateSessionServices<
    CoreSingletonServices,
    CoreUserSession,
    CoreServices
  >
) => {
  const request = new VrameworkAPIGatewayLambdaRequest(event)
  const response = new VrameworkAPIGatewayLambdaResponse()

  let origin: string | false = false
  try {
    origin = validateOrigin(allowedOrigins, singletonServices.logger, event)
  } catch {
    response.setStatus(400)
    response.setJson({ error: 'error.invalid_origin' })
  }

  response.setHeader('Access-Control-Allow-Origin', origin)
  response.setHeader('Access-Control-Allow-Credentials', true)

  return await generalHandler(
    singletonServices,
    createSessionServices,
    routes,
    routesMeta,
    request,
    response
  )
}
