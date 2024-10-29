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
import { validateAllSchemasLoaded } from '@vramework/core/schema'

type VrameworkMiddlewareArgs = RunRouteOptions & {
  logRoutes?: boolean
  validateSchemas?: boolean
}

export const vrameworkMiddleware = (
  singletonServices: CoreSingletonServices,
  createSessionServices: CreateSessionServices<any, any, any>,
  { respondWith404, logRoutes, validateSchemas }: VrameworkMiddlewareArgs
): RequestHandler => {
  if (logRoutes) {
    logRegisterRoutes(singletonServices.logger)
  }
  if (validateSchemas) {
    validateAllSchemasLoaded(singletonServices.logger)
  }

  return async (req, res, next) => {
    try {
      await runRoute(
        new VrameworkExpressRequest(req),
        new VrameworkExpressResponse(res),
        singletonServices,
        createSessionServices,
        {
          method: req.method.toLowerCase() as any,
          route: req.path,
          respondWith404,
        }
      )
    } catch {
      // Error should have already been handled by runRoute
    }

    next()
  }
}
