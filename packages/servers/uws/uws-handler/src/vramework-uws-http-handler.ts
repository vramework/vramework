import * as uWS from 'uWebSockets.js'

import {
  CoreSingletonServices,
  CreateSessionServices,
} from '@vramework/core'
import { runHTTPRoute } from '@vramework/core/http'

import { VrameworkUWSRequest } from './vramework-uws-request.js'
import { VrameworkUWSResponse } from './vramework-uws-response.js'
import { logRoutes as logRegisterRoutes, RunRouteOptions } from '@vramework/core/http'
import { loadAllSchemas } from '@vramework/core/schema'

/**
 * Options for configuring the `vrameworkHandler`.
 *
 * @typedef {Object} VrameworkuWSHandlerOptions
 * @property {CoreSingletonServices} singletonServices - The singleton services used by the handler.
 * @property {CreateSessionServices<any, any, any>} createSessionServices - A function to create session services.
 * @property {boolean} [logRoutes] - Whether to log the routes.
 * @property {boolean} [loadSchemas] - Whether to load all schemas.
 * @property {RunRouteOptions} - Additional options for running the route.
 */
export type VrameworkuWSHandlerOptions = {
  singletonServices: CoreSingletonServices
  createSessionServices: CreateSessionServices<any, any, any>
  logRoutes?: boolean
  loadSchemas?: boolean
} & RunRouteOptions

/**
 * Creates a uWebSockets handler for handling requests using the `@vramework/core` framework.
 *
 * @param {VrameworkuWSHandlerOptions} options - The options to configure the handler.
 * @returns {Function} - The request handler function.
 */
export const vrameworkHTTPHandler = ({
  logRoutes,
  singletonServices,
  createSessionServices,
  loadSchemas,
}: VrameworkuWSHandlerOptions) => {
  if (logRoutes) {
    logRegisterRoutes(singletonServices.logger)
  }
  if (loadSchemas) {
    loadAllSchemas(singletonServices.logger)
  }

  return async (res: uWS.HttpResponse, req: uWS.HttpRequest): Promise<void> => {
    try {
      await runHTTPRoute({
        request: new VrameworkUWSRequest(req, res),
        response: new VrameworkUWSResponse(res),
        singletonServices,
        createSessionServices,
        method: req.getMethod() as any,
        route: req.getUrl() as string,
      })
    } catch {
      // Error should have already been handled by runHTTPRoute
    }
  }
}
