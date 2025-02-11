import { CoreSingletonServices, CreateSessionServices } from '@pikku/core'
import { runHTTPRoute, RunRouteOptions } from '@pikku/core/http'
import { RequestHandler } from 'express'
import { PikkuExpressRequest } from './pikku-express-request.js'
import { PikkuExpressResponse } from './pikku-express-response.js'
import { logRoutes as logRegisterRoutes } from '@pikku/core/http'
import { compileAllSchemas } from '@pikku/core/schema'

/**
 * Arguments for configuring the Pikku middleware.
 *
 * @typedef {Object} PikkuMiddlewareArgs
 * @property {boolean} [skipUserSession] - Whether to skip user session creation for this route.
 * @property {boolean} [respondWith404] - Whether to respond with a 404 status if the route is not found.
 * @property {boolean} [logRoutes] - Whether to log the routes.
 * @property {boolean} [loadSchemas] - Whether to load all schemas.
 */
type PikkuMiddlewareArgs = RunRouteOptions & {
  logRoutes?: boolean
  loadSchemas?: boolean
  coerceToArray?: boolean
}

/**
 * Creates Express middleware for handling requests using the Pikku framework.
 *
 * @param {CoreSingletonServices} singletonServices - The singleton services used by the middleware.
 * @param {CreateSessionServices<any, any, any>} createSessionServices - A function to create session services for each request.
 * @param {PikkuMiddlewareArgs} options - The configuration options for the middleware.
 * @returns {RequestHandler} - The Express middleware function.
 */
export const pikkuMiddleware = (
  singletonServices: CoreSingletonServices,
  createSessionServices: CreateSessionServices<any, any, any>,
  { respondWith404, logRoutes, loadSchemas, coerceToArray }: PikkuMiddlewareArgs
): RequestHandler => {
  if (logRoutes) {
    logRegisterRoutes(singletonServices.logger)
  }
  if (loadSchemas) {
    compileAllSchemas(singletonServices.logger, singletonServices.schemaService)
  }

  return async (req, res, next) => {
    await runHTTPRoute({
      request: new PikkuExpressRequest(req),
      response: new PikkuExpressResponse(res),
      singletonServices,
      createSessionServices,
      method: req.method.toLowerCase() as any,
      route: req.path,
      respondWith404,
      coerceToArray,
    })

    next()
  }
}
