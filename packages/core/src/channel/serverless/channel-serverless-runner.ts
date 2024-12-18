import { createHTTPInteraction, loadUserSession, handleError } from "../../http/http-route-runner.js"
import { CoreServices, CoreSingletonServices, CoreUserSession, CreateSessionServices } from "../../types/core.types.js"
import { validateAndCoerce, closeSessionServices } from "../../utils.js"
import { processMessageHandlers } from "../channel-handler.js"
import { getChannels, getMatchingChannelConfig } from "../channel-runner.js"
import type { CoreAPIChannel, RunChannelOptions, RunChannelParams, VrameworkChannelHandler, VrameworkChannelHandlerFactory } from "../channel.types.js"
import { SubscriptionService } from "../subscription-service.js"
import { ServerlessWebsocketStore } from "./serverless-websocket-store.js"

export interface RunServerlessChannelParams<ChannelData> extends RunChannelParams<ChannelData> {
    serverlessWebsocketStore: ServerlessWebsocketStore
    channelHandlerFactory: VrameworkChannelHandlerFactory
}

const getVariablesForChannel = async ({ channelId, singletonServices, createSessionServices, subscriptionService, serverlessWebsocketStore, channelHandlerFactory }: {
    channelId: string,
    singletonServices: CoreSingletonServices,
    createSessionServices: CreateSessionServices<CoreSingletonServices, CoreUserSession, CoreServices<CoreSingletonServices>>,
    subscriptionService: SubscriptionService<unknown>
    serverlessWebsocketStore: ServerlessWebsocketStore,
    channelHandlerFactory: VrameworkChannelHandlerFactory
}) => {
    const { session, openingData, channelRoute } = await serverlessWebsocketStore.getData(channelId)
    const { channels } = getChannels()
    const channelConfig = channels.find(channelConfig => channelConfig.channel === channelRoute)
    if (!channelConfig) {
        throw new Error(`Channel not found: ${channelRoute}`)
    }
    const channelHandler = channelHandlerFactory(
        channelId,
        openingData,
        subscriptionService,
    )
    const sessionServices = await createSessionServices(
        singletonServices,
        {},
        session
    )
    return {
        channelConfig,
        channelHandler,
        channel: channelHandler.getChannel(),
        sessionServices,
        allServices: { ...singletonServices, ...sessionServices}
    }
}

export const runChannelConnect = async ({
    singletonServices,
    channelId,
    request,
    response,
    channel: channelRoute,
    createSessionServices,
    subscriptionService,
    serverlessWebsocketStore,
    channelHandlerFactory,
    skipUserSession = false,
    respondWith404 = true,
    coerceToArray = false,
    logWarningsForStatusCodes = [],
}: Pick<CoreAPIChannel<unknown, any>, 'channel'> &
    RunChannelOptions &
    RunServerlessChannelParams<unknown>): Promise<VrameworkChannelHandler | undefined> => {
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

        const { allServices, channel } = await getVariablesForChannel({ channelId, singletonServices, createSessionServices, subscriptionService, serverlessWebsocketStore, channelHandlerFactory })
        await channelConfig.onConnect?.(allServices, channel)
    } catch (e: any) {
        handleError(
            e,
            http,
            channelId,
            singletonServices.logger,
            logWarningsForStatusCodes
        )
        throw e
    } finally {
        await closeSessionServices(singletonServices.logger, sessionServices)
    }
}

export const runChannelDisconnect = async (params: RunServerlessChannelParams<unknown>): Promise<void> => {
    const { allServices, sessionServices, channel, channelConfig } = await getVariablesForChannel(params)
    await channelConfig.onDisconnect?.(allServices, channel)
    await closeSessionServices(allServices.logger, sessionServices)
}

export const runChannelMessage = async (params: RunServerlessChannelParams<unknown>, data: unknown): Promise<unknown> => {
    const { allServices, sessionServices, channelHandler, channelConfig } = await getVariablesForChannel(params)
    const onMessage = processMessageHandlers(
        allServices,
        channelConfig,
        channelHandler,
    )
    const response = await onMessage(data)
    await closeSessionServices(allServices.logger, sessionServices)
    return response
}
