import {
  CoreAPIChannel,
  RunChannelOptions,
  RunChannelParams,
  ChannelsMeta,
  CoreAPIChannels,
} from './channel.types.js'
import { match } from 'path-to-regexp'
import { closeServices, validateAndCoerce } from '../utils.js'
import { verifyPermissions } from '../permissions.js'
import {
  createHTTPInteraction,
  handleError,
  loadUserSession,
} from '../http/http-route-runner.js'
import { registerMessageHandlers } from './channel-handler.js'
import { VrameworkChannelHandler } from './vramework-channel-handler.js'

if (!globalThis.vramework?.channels) {
  globalThis.vramework = globalThis.vramework || {}
  globalThis.vramework.channels = []
  globalThis.vramework.channelsMeta = []
  globalThis.vramework.openChannels = new Map<string, VrameworkChannelHandler>()
}

const channels = (data?: any): CoreAPIChannels => {
  if (data) {
    globalThis.vramework.channels = data
  }
  return globalThis.vramework.channels
}

const channelsMeta = (data?: any): ChannelsMeta => {
  if (data) {
    globalThis.vramework.channelsMeta = data
  }
  return globalThis.vramework.channelsMeta
}

/**
 * Returns all the open channels on current server
 */
export const getOpenChannels = (): Map<string, VrameworkChannelHandler> => {
  return globalThis.vramework.openChannels
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

const getMatchingChannelConfig = (requestPath: string) => {
  for (const channelConfig of channels()) {
    const matchFunc = match(channelConfig.channel.replace(/^\/\//, '/'), {
      decode: decodeURIComponent,
    })
    const matchedPath = matchFunc(requestPath.replace(/^\/\//, '/'))
    if (matchedPath) {
      const schemaName = channelsMeta().find(
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

export const runChannel = async ({
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
  RunChannelParams<unknown>): Promise<VrameworkChannelHandler | undefined> => {
  let sessionServices: any | undefined
  const trackerId: string = crypto.randomUUID().toString()
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

    const broadcast = (senderId: string, data: any) => {
      const channels = getOpenChannels()
      for (const [channelId, channel] of channels.entries()) {
        if (channelId !== senderId) {
          channel.send(data)
        }
      }
    }

    const channelHandler = new VrameworkChannelHandler(
      channelId,
      data,
      subscriptionService,
      broadcast
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

    registerMessageHandlers(
      singletonServices.logger,
      channelConfig,
      channelHandler,
      allServices
    )

    channelHandler.registerOnClose(async () => {
      getOpenChannels().delete(channelId)
      channelConfig.onDisconnect?.(allServices, channel)
      await closeServices(singletonServices.logger, sessionServices)
    })

    return channelHandler
  } catch (e: any) {
    handleError(
      e,
      http,
      trackerId,
      singletonServices.logger,
      logWarningsForStatusCodes
    )
    await closeServices(singletonServices.logger, sessionServices)
    throw e
  }
}
