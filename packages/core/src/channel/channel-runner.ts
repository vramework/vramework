import { NotFoundError } from '../errors/errors.js'
import { loadUserSession } from '../http/http-route-runner.js'
import { validateAndCoerce } from '../schema.js'
import { CoreUserSession } from '../types/core.types.js'
import {
    CoreAPIChannel,
    ChannelsMeta,
    CoreAPIChannels,
    RunChannelOptions,
    RunChannelParams,
} from './channel.types.js'
import { match } from 'path-to-regexp'

if (!globalThis.pikku?.channels) {
    globalThis.pikku = globalThis.pikku || {}
    globalThis.pikku.channels = []
    globalThis.pikku.channelsMeta = []
}

const channels = (data?: any): CoreAPIChannels => {
    if (data) {
        globalThis.pikku.channels = data
    }
    return globalThis.pikku.channels
}

const channelsMeta = (data?: any): ChannelsMeta => {
    if (data) {
        globalThis.pikku.channelsMeta = data
    }
    return globalThis.pikku.channelsMeta
}

/**
 * Returns all the registered routes and associated metadata.
 * @internal
 */
export const getChannels = () => {
    return {
        channels: channels(),
        channelsMeta: channelsMeta(),
    }
}

export const addChannel = <
    In,
    Channel extends string,
    ChannelFunction,
    ChannelFunctionSessionless,
    APIPermission,
>(
    channel: CoreAPIChannel<
        In,
        Channel,
        ChannelFunction,
        ChannelFunctionSessionless,
        APIPermission
    >
) => {
    channels().push(channel as any)
}

/**
 * @ignore
 */
export const setChannelsMeta = (_channelsMeta: ChannelsMeta) => {
    channelsMeta(_channelsMeta)
}

export const getMatchingChannelConfig = (request: string) => {
    const { channels, channelsMeta } = getChannels()
    for (const channelConfig of channels) {
        const cleanedRoute = channelConfig.route.replace(/^\/\//, '/')
        const cleanedRequest = request.replace(/^\/\//, '/')
        const matchFunc = match(cleanedRoute, {
            decode: decodeURIComponent,
        })
        const matchedPath = matchFunc(cleanedRequest)
        if (matchedPath) {
            const schemaName = channelsMeta.find(
                (channelMeta) => channelMeta.route === channelConfig.route
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

export const openChannel = async ({
    route,
    singletonServices,
    skipUserSession = false,
    coerceToArray = false,
    http
}: Pick<CoreAPIChannel<unknown, string>, 'route'> & Omit<RunChannelParams<unknown>, 'response' | 'request'> & RunChannelOptions): Promise<{ userSession?: CoreUserSession, openingData: unknown, channelConfig: CoreAPIChannel<unknown, any> }> => {
    const matchingChannel = getMatchingChannelConfig(route)
    if (!matchingChannel) {
        singletonServices.logger.info(`Channel not found: ${route}`)
        throw new NotFoundError(`Channel not found: ${route}`)
    }

    const { matchedPath, params, channelConfig, schemaName } = matchingChannel

    const requiresSession = channelConfig.auth !== false
    http?.request?.setParams(params)

    singletonServices.logger.info(
        `Matched channel: ${channelConfig.name} | route: ${channelConfig.route} | auth: ${requiresSession.toString()}`
    )

    const userSession = await loadUserSession(
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

    if (singletonServices.enforceChannelAccess) {
        await singletonServices.enforceChannelAccess(
            matchingChannel.channelConfig,
            userSession
        )
    }

    let openingData: any | undefined
    if (http?.request) {
        openingData = await http.request.getData()
        validateAndCoerce(
            singletonServices.logger,
            singletonServices.schemaService,
            schemaName,
            openingData,
            coerceToArray
        )
    }

    return { userSession, openingData, channelConfig }
}