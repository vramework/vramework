import {
  CoreSingletonServices,
  CreateSessionServices,
  runRoute,
  RunRouteOptions,
  loadAllSchemas,
} from '@vramework/core'
import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { VrameworkFastifyRequest } from './vramework-fastify-request.js'
import { VrameworkFastifyResponse } from './vramework-fastify-response.js'
import { logRoutes } from '@vramework/core/log-routes'

export type VrameworkFastifyPluginOptions = {
  vramework: {
    singletonServices: CoreSingletonServices
    createSessionServices: CreateSessionServices<any, any, any>
    logRoutes?: boolean
    loadSchemas?: boolean
  } & RunRouteOptions
}

const vrameworkPlugin: FastifyPluginAsync<
  VrameworkFastifyPluginOptions
> = async (fastify, { vramework }) => {
  if (vramework.logRoutes) {
    logRoutes(vramework.singletonServices.logger)
  }
  if (vramework.loadSchemas) {
    loadAllSchemas(vramework.singletonServices.logger)
  }
  fastify.all('/*', async (req, res) => {
    try {
      await runRoute(
        new VrameworkFastifyRequest(req),
        new VrameworkFastifyResponse(res),
        vramework.singletonServices,
        vramework.createSessionServices,
        {
          method: req.method as any,
          route: req.url as string,
          respondWith404: vramework.respondWith404,
        }
      )
    } catch {
      // Error should have already been handled by runRoute
    }
  })
}

export default fp(vrameworkPlugin, '5.x')
