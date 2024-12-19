import { openChannel } from "../channel-runner.js"
import { createHTTPInteraction, handleError } from "../../http/http-route-runner.js"
import { closeSessionServices } from "../../utils.js"
import { processMessageHandlers } from "../channel-handler.js"
import { CoreAPIChannel, RunChannelOptions, RunChannelParams, VrameworkChannelHandler } from "../channel.types.js"
import { VrameworkLocalChannelHandler } from "./local-channel-handler.js"

if (!globalThis.vramework?.openChannels) {
    globalThis.vramework = globalThis.vramework || {}
    globalThis.vramework.openChannels = new Map<string, VrameworkChannelHandler>()
}

/**
 * Returns all the open channels on current server
 */
export const getOpenChannels = (): Map<string, VrameworkChannelHandler> => {
    return globalThis.vramework.openChannels
}

export const runLocalChannel = async ({
    singletonServices,
    channelId,
    request,
    response,
    route,
    createSessionServices,
    subscriptionService,
    skipUserSession = false,
    respondWith404 = true,
    coerceToArray = false,
    logWarningsForStatusCodes = [],
    bubbleErrors = false,
}: Pick<CoreAPIChannel<unknown, any>, 'route'> &
    RunChannelOptions &
    RunChannelParams<unknown>): Promise<VrameworkLocalChannelHandler | void> => {
    let sessionServices: any | undefined
    const http = createHTTPInteraction(request, response)
    try {
        const { userSession, data, channelConfig } = await openChannel({
            channelId,
            subscriptionService,
            createSessionServices,
            respondWith404,
            http,
            route,
            singletonServices,
            skipUserSession,
            coerceToArray,
        })

        const channelHandler = new VrameworkLocalChannelHandler(
            channelId,
            userSession,
            data,
            subscriptionService
        )
        const channel = channelHandler.getChannel()

        sessionServices = await createSessionServices(
            singletonServices,
            { http },
            userSession
        )
        const allServices = { ...singletonServices, ...sessionServices }

        channelHandler.registerOnOpen(() => {
            getOpenChannels().set(channelId, channelHandler)
            channelConfig.onConnect?.(allServices, channel)
        })

        channelHandler.registerOnClose(async () => {
            getOpenChannels().delete(channelId)
            channelConfig.onDisconnect?.(allServices, channel)
            await closeSessionServices(singletonServices.logger, sessionServices)
        })

        channelHandler.registerOnMessage(processMessageHandlers(
            allServices,
            channelConfig,
            channelHandler,
        ))

        return channelHandler
    } catch (e: any) {
        console.error(e)
        handleError(
            e,
            http,
            channelId,
            singletonServices.logger,
            logWarningsForStatusCodes,
            respondWith404,
            bubbleErrors
        )
    } finally {
        await closeSessionServices(singletonServices.logger, sessionServices)
    }
}
