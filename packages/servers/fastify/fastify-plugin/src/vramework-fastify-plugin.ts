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

/**
 * The `VrameworkFastifyPlugin` is a Fastify plugin that integrates the Vramework framework with Fastify,
 * providing an easy way to set up and handle requests using Vramework's routing system.
 *
 * @typedef {Object} VrameworkFastifyPluginOptions - Options for configuring the plugin.
 * @property {Object} vramework - Vramework-related configuration options.
 * @property {CoreSingletonServices} vramework.singletonServices - The singleton services used by the handler.
 * @property {CreateSessionServices<any, any, any>} vramework.createSessionServices - A function to create session services for each request.
 * @property {boolean} [vramework.logRoutes] - Whether to log the routes.
 * @property {boolean} [vramework.loadSchemas] - Whether to load all schemas.
 * @property {boolean} [vramework.skipUserSession] - Whether to skip user session creation for this route.
 * @property {boolean} [vramework.respondWith404] - Whether to respond with a 404 status if the route is not found.
 */
export type VrameworkFastifyPluginOptions = {
  vramework: {
    singletonServices: CoreSingletonServices
    createSessionServices: CreateSessionServices<any, any, any>
    logRoutes?: boolean
    loadSchemas?: boolean
  } & RunRouteOptions
}

/**
 * The `vrameworkPlugin` integrates the Vramework routing and service creation capabilities with Fastify,
 * enabling developers to easily manage route handling using Vramework's core features.
 *
 * @param {FastifyPluginAsync<VrameworkFastifyPluginOptions>} fastify - The Fastify instance.
 * @param {VrameworkFastifyPluginOptions} options - The configuration options for the plugin.
 */
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
      await runRoute({
        request: new VrameworkFastifyRequest(req),
        response: new VrameworkFastifyResponse(res),
        singletonServices: vramework.singletonServices,
        createSessionServices: vramework.createSessionServices,
        method: req.method as any,
        route: req.url as string,
        respondWith404: vramework.respondWith404,
      })
    } catch {
      // Error should have already been handled by runRoute
    }
  })
}

export default fp(vrameworkPlugin, '5.x')
