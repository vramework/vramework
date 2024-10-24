import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { InvalidOriginError } from '@vramework/core/errors'
import {
  CoreConfig,
  CoreServices,
  CoreSingletonServices,
  CoreUserSession,
  CreateSessionServices,
} from '@vramework/core/types/core.types'
import { CoreAPIRoutes, RoutesMeta } from '@vramework/core/types/routes.types'
import { runRoute } from '@vramework/core/route-runner'
import { Logger } from '@vramework/core/services/logger'

import { VrameworkLambdaRequest } from './vramework-lambda-request.js'
import { VrameworkLambdaResponse } from './vramework-lambda-response.js'

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
  services: CoreSingletonServices,
  createSessionServices: CreateSessionServices<
    CoreSingletonServices,
    CoreUserSession,
    CoreServices
  >,
  routes: CoreAPIRoutes,
  routesMeta: RoutesMeta,
  request: VrameworkLambdaRequest,
  response: VrameworkLambdaResponse
): Promise<APIGatewayProxyResult> => {
  if (request.getMethod() === 'options') {
    response.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'
    )
    response.setHeader(
      'Access-Control-Allow-Methods',
      'OPTIONS,DELETE,GET,HEAD,PATCH,POST,PUT',
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
    await runRoute(request, response, services, createSessionServices, {
      route: request.getPath(),
      method: request.getMethod() as any,
    })
  } catch {
    // Error should have already been handled by runRoute
  }

  return response.getLambdaResponse()
}

export const processCorsless = async (
  event: APIGatewayProxyEvent,
  routes: CoreAPIRoutes,
  routesMeta: RoutesMeta,
  config: CoreConfig,
  singletonServices: CoreSingletonServices,
  createSessionServices: CreateSessionServices<
    CoreSingletonServices,
    CoreUserSession,
    CoreServices
  >
) => {
  const request = new VrameworkLambdaRequest(event)
  const response = new VrameworkLambdaResponse()
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
  routes: CoreAPIRoutes,
  routesMeta: RoutesMeta,
  singletonServices: CoreSingletonServices,
  createSessionServices: CreateSessionServices<
    CoreSingletonServices,
    CoreUserSession,
    CoreServices
  >
) => {
  const request = new VrameworkLambdaRequest(event)
  const response = new VrameworkLambdaResponse()
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
  routes: CoreAPIRoutes,
  routesMeta: RoutesMeta,
  singletonServices: CoreSingletonServices,
  createSessionServices: CreateSessionServices<
    CoreSingletonServices,
    CoreUserSession,
    CoreServices
  >
) => {
  const request = new VrameworkLambdaRequest(event)
  const response = new VrameworkLambdaResponse()

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
