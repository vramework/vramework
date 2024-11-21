import {
  CoreSingletonServices,
  CreateSessionServices,
  runRoute,
  RunRouteOptions,
} from '@vramework/core'
import { RequestHandler } from 'express'
import { VrameworkExpressRequest } from './vramework-express-request.js'
import { VrameworkExpressResponse } from './vramework-express-response.js'
import { logRoutes as logRegisterRoutes } from '@vramework/core/log-routes'
import { loadAllSchemas } from '@vramework/core/schema'

/**
 * Arguments for configuring the Vramework middleware.
 *
 * @typedef {Object} VrameworkMiddlewareArgs
 * @property {boolean} [skipUserSession] - Whether to skip user session creation for this route.
 * @property {boolean} [respondWith404] - Whether to respond with a 404 status if the route is not found.
 * @property {boolean} [logRoutes] - Whether to log the routes.
 * @property {boolean} [loadSchemas] - Whether to load all schemas.
 */
type VrameworkMiddlewareArgs = RunRouteOptions & {
  logRoutes?: boolean
  loadSchemas?: boolean
  coerceToArray?: boolean
}

/**
 * Creates Express middleware for handling requests using the Vramework framework.
 *
 * @param {CoreSingletonServices} singletonServices - The singleton services used by the middleware.
 * @param {CreateSessionServices<any, any, any>} createSessionServices - A function to create session services for each request.
 * @param {VrameworkMiddlewareArgs} options - The configuration options for the middleware.
 * @returns {RequestHandler} - The Express middleware function.
 */
export const vrameworkMiddleware = (
  singletonServices: CoreSingletonServices,
  createSessionServices: CreateSessionServices<any, any, any>,
  {
    respondWith404,
    logRoutes,
    loadSchemas,
    coerceToArray,
  }: VrameworkMiddlewareArgs
): RequestHandler => {
  if (logRoutes) {
    logRegisterRoutes(singletonServices.logger)
  }
  if (loadSchemas) {
    loadAllSchemas(singletonServices.logger)
  }

  return async (req, res, next) => {
    try {
      await runRoute({
        request: new VrameworkExpressRequest(req),
        response: new VrameworkExpressResponse(res),
        singletonServices,
        createSessionServices,
        method: req.method.toLowerCase() as any,
        route: req.path,
        respondWith404,
        coerceToArray,
      })
    } catch {
      // Error should have already been handled by runRoute
    }

    next()
  }
}
