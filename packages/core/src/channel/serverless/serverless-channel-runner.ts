import { CoreUserSession, SessionServices } from "../../types/core.types.js"
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

const getVariablesForChannel = ({ channelId, userSession, channelName, subscriptionService, channelHandlerFactory, openingData }: {
    channelId: string,
    channelName: string,
    userSession?: CoreUserSession,
    subscriptionService: SubscriptionService<unknown>
    channelHandlerFactory: VrameworkChannelHandlerFactory,
    openingData?: unknown
}) => {
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
    return {
        channelConfig,
        channelHandler,
        channel: channelHandler.getChannel()
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
    let sessionServices: SessionServices<typeof singletonServices> | undefined
    const http = createHTTPInteraction(request, response)
    try {
        const { userSession, channelConfig, openingData } = await openChannel({
            channelId,
            subscriptionService,
            createSessionServices,
            http,
            route,
            singletonServices,
            coerceToArray
        })
        await channelStore.addChannel({ channelId, channelName: channelConfig.name, openingData, channelObject })
        const { channel } = getVariablesForChannel({ 
            channelId, 
            userSession, 
            subscriptionService, 
            channelHandlerFactory, 
            channelName: channelConfig.name
        })
        if (createSessionServices) {
            sessionServices = await createSessionServices(singletonServices, { http }, userSession)
        }
        await channelConfig.onConnect?.({ ...singletonServices, ...sessionServices }, channel)
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
        if (sessionServices) {
            await closeSessionServices(singletonServices.logger, sessionServices)
        }
    }
}

export const runChannelDisconnect = async ({ singletonServices, ...params }: RunServerlessChannelParams<unknown>): Promise<void> => {
    let sessionServices: SessionServices<typeof singletonServices> | undefined
    const { userSession, openingData, channelName } = await params.channelStore.getChannel(params.channelId)
    const { channel, channelConfig } = getVariablesForChannel({
        ...params,
        userSession,
        openingData,
        channelName
    })
    if (!sessionServices && params.createSessionServices) {
        sessionServices = await params.createSessionServices(singletonServices, {}, userSession)
    }
    await channelConfig.onDisconnect?.({ ...singletonServices, ...sessionServices }, channel)
    await params.channelStore.removeChannels([channel.channelId])
    if (sessionServices) {
        await closeSessionServices(singletonServices.logger, sessionServices)
    }
}

export const runChannelMessage = async ({ singletonServices, ...params }: RunServerlessChannelParams<unknown>, data: unknown): Promise<unknown> => {
    let sessionServices: SessionServices<typeof singletonServices> | undefined
    const { userSession, openingData, channelName } = await params.channelStore.getChannel(params.channelId)
    const { channelHandler, channelConfig } = getVariablesForChannel({
        ...params,
        userSession,
        openingData,
        channelName
    })
    if (params.createSessionServices) {
        sessionServices = await params.createSessionServices(singletonServices, {}, userSession)
    }
    const onMessage = processMessageHandlers(
        { ...singletonServices, ...sessionServices },
        channelConfig,
        channelHandler,
    )
    const response = await onMessage(data)
    if (sessionServices) {
        await closeSessionServices(singletonServices.logger, sessionServices)
    }
    return response
}
