/**
 * The `JoseJWTService` class provides functionality for handling JSON Web Tokens (JWTs) using the `jose` library. 
 * It implements the `JWTService` interface from the `@vramework/core` module, allowing for secure encoding, decoding, and verification of JWTs.
 *
 * @module @vramework/uws-handler
 */

import * as uWS from 'uWebSockets.js'

import {
  CoreSingletonServices,
  CreateSessionServices,
} from '@vramework/core/types/core.types'
import { runRoute, RunRouteOptions } from '@vramework/core/route-runner'

import { VrameworkUWSRequest } from './vramework-uws-request.js'
import { VrameworkUWSResponse } from './vramework-uws-response.js'
import { logRoutes as logRegisterRoutes } from '@vramework/core/log-routes'
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
export const vrameworkHandler = ({
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
      await runRoute(
        new VrameworkUWSRequest(req, res),
        new VrameworkUWSResponse(res),
        singletonServices,
        createSessionServices,
        {
          method: req.getMethod() as any,
          route: req.getUrl() as string,
        }
      )
    } catch {
      // Error should have already been handled by runRoute
    }
  }
}
