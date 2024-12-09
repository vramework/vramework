import {
  CoreSingletonServices,
  CoreServices,
  CoreUserSession,
  JSONValue,
} from '../types/core.types.js'
import { CoreAPIChannel } from './channel.types.js'
import { getChannels } from './channel-runner.js'
import { VrameworkChannelHandler } from './vramework-channel-handler.js'
import { Logger } from '../services/logger.js'
import { verifyPermissions } from '../permissions.js'

const validateSchema = (
  logger: CoreSingletonServices['logger'],
  data: JSONValue,
  channelName: string,
  routingProperty?: string,
  routerValue?: string
) => {
  const { channelsMeta } = getChannels()
  for (const channelMeta of channelsMeta) {
    if (routingProperty && routerValue) {
      const channelRoute =
        channelMeta.messageRoutes[routingProperty]?.[routerValue]
      if (channelRoute) {
        const schemaNames = channelRoute.inputs
        if (schemaNames) {
          // loadSchema(schemaNames, logger)
          // validateJson(schemaNames, data)
        }
        return
      }
    }
  }
}

const validateAuth = (
  requiresSession: boolean,
  channelHandler: VrameworkChannelHandler,
  onMessage: any
) => {
  const auth =
    typeof onMessage === 'function'
      ? requiresSession
      : onMessage.auth === undefined
        ? requiresSession
        : onMessage.auth
  if (auth && !channelHandler.getChannel().session) {
    return false
  }
  return true
}

const validatePermissions = async (
  services: CoreServices,
  channelHandler: VrameworkChannelHandler,
  onMessage: any,
  data: unknown
) => {
  const permissions =
    typeof onMessage === 'function' ? {} : onMessage.permissions
  return await verifyPermissions(
    permissions,
    services,
    data,
    channelHandler.getChannel().session
  )
}

const runFunction = async (
  services: CoreServices,
  channelHandler: VrameworkChannelHandler,
  onMessage: any,
  data: unknown
) => {
  const func: any = typeof onMessage === 'function' ? onMessage : onMessage.func
  await func(services, channelHandler.getChannel(), data)
}

export const registerMessageHandlers = (
  logger: Logger,
  channelConfig: CoreAPIChannel<any, any>,
  channelHandler: VrameworkChannelHandler<CoreUserSession, unknown>,
  services: CoreServices
) => {
  const requiresSession = channelConfig.auth !== false

  const processMessage = async (
    data: JSONValue,
    onMessage: any,
    routingProperty?: string,
    routerValue?: string
  ): Promise<void> => {
    if (!validateAuth(requiresSession, channelHandler, onMessage)) {
      logger.error(
        `Channel ${channelConfig.channel} requires a session for ${routingProperty || 'default message route'}`
      )
    }

    validateSchema(
      services.logger,
      data,
      channelConfig.channel,
      routingProperty,
      routerValue
    )

    const hasPermission = await validatePermissions(
      services,
      channelHandler,
      onMessage,
      data
    )
    if (!hasPermission) {
      logger.error(
        `Channel ${channelConfig.channel} requires permissions for ${routingProperty || 'default message route'}`
      )
    }

    await runFunction(services, channelHandler, onMessage, data)
  }

  channelHandler.registerOnMessage(async (rawData) => {
    let processed = false

    try {
      // Route-specific handling
      if (typeof rawData === 'string' && channelConfig.onMessageRoute) {
        const messageData = JSON.parse(rawData)
        const entries = Object.entries(channelConfig.onMessageRoute)
        for (const [routingProperty, routes] of entries) {
          const routerValue = messageData[routingProperty]
          if (routerValue && routes[routerValue]) {
            processed = true
            await processMessage(
              messageData,
              routes[routerValue],
              routingProperty,
              routerValue
            )
            break
          }
        }

        // Default handler if no routes matched but json data was parsed
        if (!processed && channelConfig.onMessage) {
          processed = true
          await processMessage(messageData, channelConfig.onMessage)
        }
      }

      // Default handler if no routes matched and json data wasn't parsed
      if (!processed && channelConfig.onMessage) {
        await processMessage(rawData, channelConfig.onMessage)
      }
    } catch (error) {
      // Most likely a json error.. ignore
    }

    if (!processed) {
      logger.error(
        `No handler found for message in channel ${channelConfig.channel} for ${rawData}`
      )
    }
  })
}
