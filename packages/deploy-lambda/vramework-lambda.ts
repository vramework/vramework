import { APIGatewayProxyEvent } from 'aws-lambda'
import { CoreConfig, CoreSingletonServices, CreateSessionServices } from '@vramework/core/types'
import { CoreAPIRoutes } from '@vramework/core/routes'
import { getErrorResponse, InvalidOriginError } from '@vramework/core/errors'
import { v4 as uuid } from 'uuid'
import { VrameworkLambdaRequest } from './vramework-lambda-request'
import { VrameworkLambdaResponse } from './vramework-lambda-response'
import { Logger } from '@vramework/core/services/logger'
import { runRoute } from '@vramework/core/router-runner'

const validateOrigin = (allowsOrigins: string[], logger: Logger, event: APIGatewayProxyEvent): string => {
  const origin = event.headers.origin
  if (!origin || allowsOrigins.every(domain => !origin.includes(domain))) {
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
  createSessionServices: CreateSessionServices,
  routes: CoreAPIRoutes,
  request: VrameworkLambdaRequest,
  response: VrameworkLambdaResponse,
): Promise<void> => {
  if (request.getMethod() === 'options') {
    response.setHeaders({
      'Access-Control-Allow-Headers':
        'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
      'Access-Control-Allow-Methods': 'OPTIONS,DELETE,GET,HEAD,PATCH,POST,PUT',
    })
    response.setStatus(200)
    response.setJson({})
    return
  }

  if (request.getPath().includes('health-check')) {
    response.setStatus(200)
    return
  }

  try {
    await runRoute(
      request,
      response,
      services,
      createSessionServices,
      routes,
      {
        route: request.getPath(),
        type: request.getMethod() as any
      }
    )
  } catch (e: any) {
    const errorResponse = getErrorResponse(e)
    let _statusCode: number

    if (errorResponse != null) {
      const errorId = (e as any).errorId || uuid()
      _statusCode = errorResponse.status
      services.logger.warn(`Warning id: ${errorId}`)
      services.logger.warn(e)
    } else {
      const errorId = services.logger.error(`Uncaught Error: ${e.message}`, e)
      console.trace(e)
      response.setStatus(500)
      response.setJson({ errorId })
    }

    throw e
  }
}

export const processCorsless = async (
  event: APIGatewayProxyEvent,
  routes: CoreAPIRoutes,
  config: CoreConfig,
  singletonServices: CoreSingletonServices,
  createSessionServices: CreateSessionServices
) => {
  const request = new VrameworkLambdaRequest(event)
  const response = new VrameworkLambdaResponse()
  return await generalHandler(singletonServices, createSessionServices, routes, request, response)
}

export const processFromAnywhereCors = async (
  event: APIGatewayProxyEvent,
  routes: CoreAPIRoutes,
  config: CoreConfig,
  singletonServices: CoreSingletonServices,
  createSessionServices: CreateSessionServices
) => {
  const request = new VrameworkLambdaRequest(event)
  const response = new VrameworkLambdaResponse()
  response.setHeader('Access-Control-Allow-Origin', event.headers.origin)
  response.setHeader('Access-Control-Allow-Credentials', true)
  return await generalHandler(singletonServices, createSessionServices, routes, request, response)
}

export const processCors = async (
  event: APIGatewayProxyEvent,
  allowedOrigins: string[],
  routes: CoreAPIRoutes,
  singletonServices: CoreSingletonServices,
  createSessionServices: CreateSessionServices
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

  await generalHandler(singletonServices, createSessionServices, routes, request, response)

  return response.getLambdaResponse()
}
