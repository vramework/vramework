import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as querystring from 'querystring'
import { serialize as serializeCookie } from 'cookie'
import { CoreConfig, CoreSingletonServices, CreateHTTPSessionServices } from '@vramework/core/types'
import { verifyPermissions } from '@vramework/core/permissions'
import { CoreAPIRoute, CoreAPIRoutes } from '@vramework/core/routes'
import { loadSchema, validateJson } from '@vramework/core/schema'
import { getErrorResponse, InvalidOriginError, NotFoundError } from '@vramework/core/errors'
import { v4 as uuid } from 'uuid'
import { URL } from 'url'

// @ts-ignore
import { match } from "path-to-regexp"

const getDomainFromHeaders = (headers: Record<string, string>): string | undefined => {
  const origin = headers.origin
  if (origin) {
    const url = new URL(headers.origin)
    return url.port !== '80' && url.port !== '443' ? url.host : `${url.host}:${url.port}`
  }
  return undefined
}

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
  const errorResponse = getErrorResponse(e)
  let statusCode: number

  if (errorResponse != null) {
    const errorId = (e as any).errorId || uuid()
    statusCode = errorResponse.status
    services.logger.warn(`Warning id: ${errorId}`)
    services.logger.warn(e)
    return {
      headers,
      statusCode,
      body: JSON.stringify({ message: errorResponse.message, payload: (e as any).payload, errorId }),
    }
  }

  const errorId = services.logger.error(`Uncaught Error: ${e.message}`, e)
  console.trace(e)
  return {
    headers,
    statusCode: 500,
    body: JSON.stringify({ errorId }),
  }
}

const getMatchingRoute = (
  logger: CoreSingletonServices['logger'],
  requestType: string,
  requestPath: string,
  routes: Array<CoreAPIRoute<unknown, unknown>>,
) => {
  let matchedPath: any | undefined
  for (const route of routes) {
    if (route.type !== requestType.toLowerCase()) {
      continue
    }
    const matchFunc = match(`/${route.route}`, { decode: decodeURIComponent })
    matchedPath = matchFunc(requestPath)
    if (matchedPath) {
      if (route.schema) {
        loadSchema(route.schema, logger)
      }
      return { matchedPath, route }
    }
  }
  logger.info({ message: 'Invalid route', requestPath, requestType })
  throw new NotFoundError()
}

const getHeaderValue = (event: APIGatewayProxyEvent, headerName: string): string | undefined => event.headers?.[headerName] ?? event.headers?.[headerName.toLocaleLowerCase()]

const generalHandler = async (
  _config: CoreConfig,
  services: CoreSingletonServices,
  createHTTPSessionServices: CreateHTTPSessionServices,
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
        'Set-Cookie': serializeCookie(services.sessionService.getCookieName(event.headers as Record<string, string>), 'invalid', {
          expires: new Date(0),
          domain: getDomainFromHeaders(event.headers as Record<string, string>),
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'none'
        }),
      },
    }
  }

  try {
    const { matchedPath, route } = getMatchingRoute(services.logger, event.httpMethod, event.path, routes)
    services.logger.info({ message: 'Executing route', matchedPath, route })
    let session
    try {
      session = await services.sessionService.getUserSession(
        route.requiresSession !== false,
        event.headers,
        event
      )
    } catch (e: any) {
      services.logger.info({
        action: 'Rejecting route (invalid session)',
        path: matchedPath,
        route,
        headers: event.headers,
        IP: event.headers['X-Forwarded-For'],
        userId: session?.userId,
        session: JSON.stringify(session)
      })
      throw e
    }

    services.logger.info({
      action: 'Executing route',
      path: matchedPath,
      route,
      headers: event.headers,
      IP: event.headers['X-Forwarded-For'],
      userId: session?.userId,
      session: JSON.stringify(session)
    })

    const contentType = getHeaderValue(event, 'Content-Type')

    let data: any = undefined
    if (contentType !== undefined && event.body) {
      if (contentType.includes('text/xml')) {
        data = event.body
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        data = querystring.decode(event.body)
      }
    }
    if (data === undefined) {
      data = { ...matchedPath.params, ...event.queryStringParameters, ...JSON.parse(event.body ?? '{}') }
    }

    if (route.schema) {
      validateJson(route.schema, data)
    }

    const sessionServices = await createHTTPSessionServices(services, session, event)
    try {
      if (route.permissions) {
        await verifyPermissions(route.permissions, sessionServices, data, session)
      }
      const result = await route.func(sessionServices, data, session)
      if (result && (result as any).jwt) {
        headers['Set-Cookie'] = serializeCookie(services.sessionService.getCookieName(event.headers as Record<string, string>), (result as any).jwt, {
          domain: getDomainFromHeaders(event.headers as Record<string, string>),
          path: '/',
          httpOnly: true,
          secure: true,
          maxAge: 60 * 60 * 24 * 1,
          sameSite: 'none'
        })
      }
      return {
        statusCode: 200,
        body: route.returnsJSON === false ? (result as any) : JSON.stringify(result),
        headers,
      }
    } catch (e: any) {
      throw e
    } finally {
      for (const service of Object.values(sessionServices)) {
        if (service.closeSession) {
          await service.closeSession()
        }
      }
    }
  } catch (e: any) {
    return errorHandler(services, e, headers)
  }
}

export const processCorsless = async (
  event: APIGatewayProxyEvent,
  routes: CoreAPIRoutes,
  config: CoreConfig,
  singletonServices: CoreSingletonServices,
  createHTTPSessionServices: CreateHTTPSessionServices
) => {
  return await generalHandler(config, singletonServices, createHTTPSessionServices, routes, event, {})
}

export const processFromAnywhereCors = async (
  event: APIGatewayProxyEvent,
  routes: CoreAPIRoutes,
  config: CoreConfig,
  singletonServices: CoreSingletonServices,
  createHTTPSessionServices: CreateHTTPSessionServices
) => {
  const headers: Record<string, string | boolean> = {
    'Access-Control-Allow-Origin': event.headers.origin!,
    'Access-Control-Allow-Credentials': true,
  }
  return await generalHandler(config, singletonServices, createHTTPSessionServices, routes, event, headers)
}

export const processCors = async (
  event: APIGatewayProxyEvent,
  routes: CoreAPIRoutes,
  config: CoreConfig,
  services: CoreSingletonServices,
  createHTTPSessionServices: CreateHTTPSessionServices
) => {
  let origin: string | false = false
  try {
    origin = validateOrigin(config, services, event)
  } catch (e: any) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'error.invalid_origin' }),
    }
  }
  const headers: Record<string, string | boolean> = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': true,
  }
  return await generalHandler(config, services, createHTTPSessionServices, routes, event, headers)
}
