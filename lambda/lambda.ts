import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { match, Match } from 'path-to-regexp'

import { serialize as serializeCookie } from 'cookie'
import { CoreSingletonServices } from '@vramework/backend-common/src/services'
import { CoreConfig } from '@vramework/backend-common/src/config'
import { verifyPermissions } from '@vramework/backend-common/src/permissions'
import { CoreAPIRoute, CoreAPIRoutes } from '@vramework/backend-common/src/routes'
import { loadSchema, validateJson } from '@vramework/backend-common/src/schema'
import { getErrorResponse, InvalidOriginError, NotFoundError } from '@vramework/backend-common/src/errors'

const validateOrigin = (config: CoreConfig, services: CoreSingletonServices, event: APIGatewayProxyEvent): string => {
  const origin = event.headers.origin
  const corsDomains = config.corsDomains || [config.domain]
  if (!origin || corsDomains.every(domain => !origin.includes(domain))) {
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

const errorHandler = (services: CoreSingletonServices, e: Error, headers: Record<string, string | boolean>) => {
  const errorResponse = getErrorResponse(e.constructor)
  let statusCode: number
  if (errorResponse != null) {
    statusCode = errorResponse.status
    services.logger.warn(e)
    return {
      headers,
      statusCode,
      body: JSON.stringify({ message: errorResponse.message, payload: (e as any).payload  }),
    }
  }

  services.logger.error(`Uncaught Error: ${e.message}`, e)
  console.error(e)
  return {
    headers,
    statusCode: 500,
    body: JSON.stringify({}),
  }
}

const getMatchingRoute = (
  services: CoreSingletonServices,
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
  services: CoreSingletonServices,
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
          domain: event.headers.origin,
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

    const session = await services.jwt.getUserSession(
      route.requiresSession !== false,
      event.headers['Authorization'],
      config.cookie.name,
      event.headers.cookie,
      event
    )

    const isXML = event.headers['Content-Type']?.includes('text/xml')

    let data: any
    if (isXML) {
      data = event.body
    } else {
      data = { ...matchedPath.params, ...event.queryStringParameters,  ...JSON.parse(event.body ?? '{}') }
      if (route.schema) {
        validateJson(route.schema, data)
      }
    }

    console.log(session)

    const sessionServices = await services.createSessionServices(services, session)
    try {
      if (route.permissions) {
        await verifyPermissions(route.permissions, sessionServices, data, session)
      }
      const result = await route.func(sessionServices, data, session)
      if (result && (result as any).jwt) {
        headers['Set-Cookie'] = serializeCookie(config.cookie.name, (result as any).jwt, {
          // domain: event.headers.origin,
          path: '/',
          httpOnly: true,
          secure: true,
          maxAge: 60 * 60 * 24 * 1,
        })
      }
      return {
        statusCode: 200,
        body: route.returnsJSON === false ? (result as any) : JSON.stringify(result),
        headers,
      }
    } catch (e) {
      throw e
    } finally {
      for (const service of Object.values(sessionServices)) {
        if (service.closeSession) {
          await service.closeSession()
        }
      }
    }
  } catch (e) {
    return errorHandler(services, e, headers)
  }
}

export const processCorsless = async (
  event: APIGatewayProxyEvent,
  routes: CoreAPIRoutes,
  config: CoreConfig,
  services: CoreSingletonServices,
) => {
  return await generalHandler(config, services, routes, event, {})
}

export const processCors = async (
  event: APIGatewayProxyEvent,
  routes: CoreAPIRoutes,
  config: CoreConfig,
  services: CoreSingletonServices,
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
