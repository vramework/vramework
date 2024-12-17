import { match } from "path-to-regexp"
import { getChannels } from "../channel-runner.js"
import { createHTTPInteraction, loadUserSession, handleError } from "../../http/http-route-runner.js"
import { verifyPermissions } from "../../permissions.js"
import { validateAndCoerce, closeServices } from "../../utils.js"
import { processMessageHandlers } from "../channel-handler.js"
import { CoreAPIChannel, RunChannelOptions, RunChannelParams } from "../channel.types.js"
import { VrameworkLocalChannelHandler } from "./local-channel-handler.js"
import { VrameworkChannelHandler } from "../vramework-channel-handler.js"

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

const getMatchingChannelConfig = (requestPath: string) => {
    const { channels, channelsMeta } = getChannels()
    for (const channelConfig of channels) {
        const matchFunc = match(channelConfig.channel.replace(/^\/\//, '/'), {
            decode: decodeURIComponent,
        })
        const matchedPath = matchFunc(requestPath.replace(/^\/\//, '/'))
        if (matchedPath) {
            const schemaName = channelsMeta.find(
                (channelMeta) => channelMeta.channel === channelConfig.channel
            )?.input
            return {
                matchedPath,
                params: matchedPath.params,
                channelConfig,
                schemaName,
            }
        }
    }

    return null
}

export const runLocalChannel = async ({
    singletonServices,
    channelId,
    request,
    response,
    channel: channelRoute,
    createSessionServices,
    subscriptionService,
    skipUserSession = false,
    respondWith404 = true,
    coerceToArray = false,
    logWarningsForStatusCodes = [],
}: Pick<CoreAPIChannel<unknown, any>, 'channel'> &
    RunChannelOptions &
    RunChannelParams<unknown>): Promise<VrameworkLocalChannelHandler | undefined> => {
    let sessionServices: any | undefined
    const http = createHTTPInteraction(request, response)

    const matchingChannel = getMatchingChannelConfig(channelRoute)
    if (!matchingChannel) {
        if (respondWith404) {
            http?.response?.setStatus(404)
            http?.response?.end()
        }
        return
    }

    try {
        const { matchedPath, params, channelConfig, schemaName } = matchingChannel

        const requiresSession = channelConfig.auth !== false
        http?.request?.setParams(params)

        singletonServices.logger.info(
            `Matched channel: ${channelConfig.channel} | auth: ${requiresSession.toString()}`
        )

        const session = await loadUserSession(
            skipUserSession,
            // We may require a session, but we don't actually need it
            // on connect since channels can authenticate later given
            // how websocket sessions work (cookie or queryParam based)
            false,
            http,
            matchedPath,
            channelConfig,
            singletonServices.logger,
            singletonServices.httpSessionService
        )

        if (singletonServices.channelPermissionService) {
            await singletonServices.channelPermissionService.verifyChannelAccess(
                matchingChannel.channelConfig,
                session
            )
        }

        let data: any | undefined
        if (request) {
            data = await request.getData()
            validateAndCoerce(
                singletonServices.logger,
                schemaName,
                data,
                coerceToArray
            )
        }

        const channelHandler = new VrameworkLocalChannelHandler(
            channelId,
            data,
            subscriptionService
        )
        const channel = channelHandler.getChannel()

        sessionServices = await createSessionServices(
            singletonServices,
            { http },
            session
        )
        const allServices = { ...singletonServices, ...sessionServices }

        await verifyPermissions(
            channelConfig.permissions,
            allServices,
            data,
            session
        )

        channelHandler.registerOnOpen(async () => {
            getOpenChannels().set(channelId, channelHandler)
            channelConfig.onConnect?.(allServices, channel)
        })

        channelHandler.registerOnClose(async () => {
            getOpenChannels().delete(channelId)
            channelConfig.onDisconnect?.(allServices, channel)
            await closeServices(singletonServices.logger, sessionServices)
        })

        channelHandler.registerOnMessage(processMessageHandlers(
            allServices,
            channelConfig,
            channelHandler,
        ))

        return channelHandler
    } catch (e: any) {
        handleError(
            e,
            http,
            channelId,
            singletonServices.logger,
            logWarningsForStatusCodes
        )
        await closeServices(singletonServices.logger, sessionServices)
        throw e
    }
}
