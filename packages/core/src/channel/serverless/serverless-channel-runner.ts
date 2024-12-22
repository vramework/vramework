import { CoreSingletonServices, CoreUserSession, CreateSessionServices, VrameworkHTTP } from "../../types/core.types.js"
import { closeSessionServices } from "../../utils.js"
import { processMessageHandlers } from "../channel-handler.js"
import { getChannels, openChannel } from "../channel-runner.js"
import type { CoreAPIChannel, RunChannelOptions, RunChannelParams, VrameworkChannelHandlerFactory } from "../channel.types.js"
import { SubscriptionService } from "../subscription-service.js"
import { ServerlessChannelStore } from "./serverless-channel-store.js"
import { createHTTPInteraction, handleError } from "../../http/http-route-runner.js"

export interface RunServerlessChannelParams<ChannelData> extends RunChannelParams<ChannelData> {
    channelStore: ServerlessChannelStore
    channelHandlerFactory: VrameworkChannelHandlerFactory
    channelObject?: unknown
}

const getVariablesForChannel = async ({ channelId, channelObject, userSession, channelName, singletonServices, createSessionServices, subscriptionService, channelStore, channelHandlerFactory, http }: {
    channelId: string,
    channelName?: string,
    channelObject?: unknown,
    userSession?: CoreUserSession,
    singletonServices: CoreSingletonServices,
    createSessionServices: CreateSessionServices,
    subscriptionService: SubscriptionService<unknown>
    channelStore: ServerlessChannelStore,
    channelHandlerFactory: VrameworkChannelHandlerFactory,
    http?: VrameworkHTTP
}) => {
    let openingData: any | undefined
    if (!channelName) {
        ({ userSession, openingData, channelName } = await channelStore.getChannel(channelId));
    } else {
        await channelStore.addChannel({ channelId, channelName, openingData, channelObject })
    }

    const { channels } = getChannels()
    const channelConfig = channels.find(channelConfig => channelConfig.name === channelName)
    if (!channelConfig) {
        throw new Error(`Channel not found: ${channelName}`)
    }
    const channelHandler = channelHandlerFactory(
        channelId,
        openingData,
        userSession,
        subscriptionService,
    )
    const sessionServices = await createSessionServices(
        singletonServices,
        { http },
        userSession
    )
    return {
        channelConfig,
        channelHandler,
        channel: channelHandler.getChannel(),
        sessionServices,
        allServices: { ...singletonServices, ...sessionServices }
    }
}

export const runChannelConnect = async ({
    singletonServices,
    channelId,
    channelObject,
    request,
    response,
    route,
    createSessionServices,
    subscriptionService,
    channelStore,
    channelHandlerFactory,
    coerceToArray = false,
    logWarningsForStatusCodes = [],
    respondWith404 = true,
    bubbleErrors = false
}: Pick<CoreAPIChannel<unknown, any>, 'route'> &
    RunChannelOptions &
    RunServerlessChannelParams<unknown>) => {
    let sessionServices: any | undefined

    const http = createHTTPInteraction(request, response)
    try {
        const { userSession, channelConfig } = await openChannel({
            channelId,
            subscriptionService,
            createSessionServices,
            http,
            route,
            singletonServices,
            coerceToArray
        })
        const { allServices, channel } = await getVariablesForChannel({ 
            channelId, 
            channelObject,
            userSession, 
            singletonServices, 
            createSessionServices, 
            subscriptionService, channelStore, 
            channelHandlerFactory, 
            channelName: channelConfig.name, 
            http 
        })
        await channelConfig.onConnect?.(allServices, channel)
        http?.response?.setStatus(101)
        return { name: channelConfig.name, userSession }
    } catch (e: any) {
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

export const runChannelDisconnect = async (params: RunServerlessChannelParams<unknown>): Promise<void> => {
    const { allServices, sessionServices, channel, channelConfig } = await getVariablesForChannel(params)
    await channelConfig.onDisconnect?.(allServices, channel)
    await params.channelStore.removeChannels([channel.channelId])
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
