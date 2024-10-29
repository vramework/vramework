import * as uWS from 'uWebSockets.js'

import {
  CoreSingletonServices,
  CreateSessionServices,
} from '@vramework/core/types/core.types'
import { runRoute, RunRouteOptions } from '@vramework/core/route-runner'

import { VrameworkUWSRequest } from './vramework-uws-request.js'
import { VrameworkUWSResponse } from './vramework-uws-response.js'
import { logRoutes as logRegisterRoutes } from '@vramework/core/log-routes'
import { validateAllSchemasLoaded } from '@vramework/core/schema'

export type VrameworkuWSHandlerOptions = {
  singletonServices: CoreSingletonServices
  createSessionServices: CreateSessionServices<any, any, any>
  logRoutes?: boolean
  validateSchemas?: boolean
} & RunRouteOptions

export const vrameworkHandler = ({
  logRoutes,
  singletonServices,
  createSessionServices,
  validateSchemas,
}: VrameworkuWSHandlerOptions) => {
  if (logRoutes) {
    logRegisterRoutes(singletonServices.logger)
  }
  if (validateSchemas) {
    validateAllSchemasLoaded(singletonServices.logger)
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
