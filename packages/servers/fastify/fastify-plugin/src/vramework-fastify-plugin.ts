import { CoreServices, CoreSingletonServices, CoreUserSession, CreateSessionServices, runRoute, RunRouteOptions } from '@vramework/core'
import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { VrameworkFastifyRequest } from './vramework-fastify-request.js'
import { VrameworkFastifyResponse } from './vramework-fastify-response.js'

export type VrameworkFastifyPluginOptions = {
    vramework: {
        singletonServices: CoreSingletonServices
        createSessionServices: CreateSessionServices<CoreSingletonServices, CoreUserSession, CoreServices>
    } & RunRouteOptions
}

const vrameworkPlugin: FastifyPluginAsync<VrameworkFastifyPluginOptions> = async (fastify, { vramework }) => {
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
                    set404Status: vramework.set404Status
                }
            )
        } catch {
            // Error should have already been handled by runRoute
        }
    })
}

export default fp(vrameworkPlugin, '5.x')