import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { match, Match } from 'path-to-regexp'

import { serialize as serializeCookie } from 'cookie'
import { CoreServices } from '@vramework/backend-common/src/services'
import { CoreConfig } from '@vramework/backend-common/src/config'
import { CoreAPIRoute, CoreAPIRoutes } from '@vramework/backend-common/src/routes'
import { loadSchema, validateJson } from '@vramework/backend-common/src/schema'
import { getErrorResponse, InvalidOriginError, NotFoundError } from '@vramework/backend-common/src/errors'

const validateOrigin = (config: CoreConfig, services: CoreServices, event: APIGatewayProxyEvent): string => {
  const origin = event.headers.origin

  if (!origin || !origin.includes(config.domain)) {
    services.logger.error(`
CORS Error
  - Recieved from origin: ${origin}
  - Expected domain: ${config.domain}
  - Host: ${event.headers.host}
  - Path: ${event.path}
  - Headers: ${JSON.stringify(event.headers, null, '\t')}
`)
    throw new InvalidOriginError()
  }

  return origin
}

const errorHandler = (services: CoreServices, e: Error, headers: Record<string, string | boolean>) => {
  const errorResponse = getErrorResponse(e.constructor)
  let statusCode: number
  if (errorResponse != null) {
    statusCode = errorResponse.status
    services.logger.warn(e)
    return {
      headers,
      statusCode,
      body: JSON.stringify({ error: errorResponse.message }),
    }
  }
  return {
    headers,
    statusCode: 500,
    body: JSON.stringify({}),
  }
}

const getMatchingRoute = (
  services: CoreServices,
  requestType: string,
  requestPath: string,
  routes: Array<CoreAPIRoute<unknown, unknown>>,
) => {
  let matchedPath: Match | undefined
  for (const route of routes) {
    if (route.type !== requestType.toLowerCase()) {
      continue
    }
    const matchFunc = match(`/${route.route}`, { decode: decodeURIComponent })
    matchedPath = matchFunc(requestPath)
    if (matchedPath) {
      if (route.schema) {
        loadSchema(route.schema, services.logger)
      }
      return { matchedPath, route }
    }
  }
  services.logger.info({ message: 'Invalid route', requestPath, requestType })
  throw new NotFoundError()
}

const generalHandler = async (
  config: CoreConfig,
  services: CoreServices,
  routes: CoreAPIRoutes,
  event: APIGatewayProxyEvent,
  headers: Record<string, any>,
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod.toLowerCase() === 'options') {
    return {
      headers: {
        ...headers,
        'Access-Control-Allow-Headers':
          'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
        'Access-Control-Allow-Methods': 'OPTIONS,DELETE,GET,HEAD,PATCH,POST,PUT',
      },
      statusCode: 200,
      body: '{}',
    }
  }

  if (event.path.includes('health-check')) {
    return {
      headers,
      statusCode: 200,
      body: '{}',
    }
  }

  if (event.path.includes('logout')) {
    return {
      statusCode: 200,
      body: '{}',
      headers: {
        ...headers,
        'Set-Cookie': serializeCookie(config.cookie.name, 'invalid', {
          expires: new Date(0),
          domain: config.domain,
          path: '/',
          httpOnly: true,
          secure: true,
        }),
      },
    }
  }

  try {
    const { matchedPath, route } = getMatchingRoute(services, event.httpMethod, event.path, routes)
    services.logger.info({ action: 'Executing route', path: matchedPath, route })
    services.logger.info( JSON.stringify(event))

    const session = await services.jwt.getUserSession(
      route.requiresSession !== false,
      event.headers['Authorization'],
      config.cookie.name,
      event.headers.cookie,
      event
    )

    let data = { ...matchedPath.params, ...event.queryStringParameters }
    if (event.headers['Content-Type']?.includes('application/json') && event.body) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'error.content_type_json_only' }),
      }
    } else {
      data = { ...data, ...JSON.parse(event.body ?? '{}') }
    }

    if (route.schema) {
      validateJson(route.schema, data)
    }

    // TODO: Add permissions

    const result = await route.func(services, data, session)
    if (result && (result as any).jwt) {
      headers['Set-Cookie'] = serializeCookie(config.cookie.name, (result as any).jwt, {
        domain: config.domain,
        path: '/',
        httpOnly: true,
        secure: true,
        maxAge: 60 * 60 * 24 * 1,
      })
    }
    return {
      statusCode: 200,
      body: JSON.stringify(result),
      headers,
    }
  } catch (e) {
    return errorHandler(services, e, headers)
  }
}

export const processCorsless = async (
  event: APIGatewayProxyEvent,
  routes: CoreAPIRoutes,
  config: CoreConfig,
  services: CoreServices,
) => {
  return await generalHandler(config, services, routes, event, {})
}

export const processCors = async (
  event: APIGatewayProxyEvent,
  routes: CoreAPIRoutes,
  config: CoreConfig,
  services: CoreServices,
) => {
  let origin: string | false = false
  try {
    origin = validateOrigin(config, services, event)
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'error.invalid_origin' }),
    }
  }
  const headers: Record<string, string | boolean> = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': true,
  }
  return await generalHandler(config, services, routes, event, headers)
}
