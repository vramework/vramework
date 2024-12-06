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

const validateSchema = (
  logger: CoreSingletonServices['logger'],
  data: JSONValue,
  channelName: string,
  routingProperty?: string,
  routerValue?: string,
) => {
  const { channelsMeta } = getChannels()
  for (const channelMeta of channelsMeta) {
    if (routingProperty && routerValue) {
      const channelRoute = channelMeta.messageRoutes[routingProperty]?.[routerValue]
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

const runFunction = async (services: CoreServices, channelHandler: VrameworkChannelHandler, onMessage: any, data: unknown) => {
  const func: any = typeof onMessage === 'function' ? onMessage : onMessage.func
  await func(services, channelHandler.getChannel(), data)
}

export const registerMessageHandlers = (
  logger: Logger,
  channelConfig: CoreAPIChannel<any, any>,
  channelHandler: VrameworkChannelHandler<CoreUserSession, unknown>,
  services: CoreServices,
) => {
  channelHandler.registerOnMessage(async (data) => {
    let processed = false
    try {
      let messageData: JSONValue
      if (typeof data === 'string') {
        messageData = JSON.parse(data)
      }

      if (channelConfig.onMessageRoute && messageData) {
        const routingProperties = Object.keys(channelConfig.onMessageRoute)
        for (const routingProperty of routingProperties) {
          const routerValue: string = messageData[routingProperty]
          if (routerValue) {
            processed = true
            validateSchema(
              services.logger,
              messageData,
              channelConfig.channel,
              routingProperty,
              routerValue,
            )
            await runFunction(
              services,
              channelHandler,
              channelConfig.onMessageRoute[routingProperty]![routerValue],
              messageData
            )
          }
        }
      }

      const onMessage = channelConfig.onMessage
      if (!processed && onMessage) {
        processed = true
        validateSchema(
          services.logger,
          messageData,
          channelConfig.channel,
        )
        await runFunction(services, channelHandler, onMessage, messageData)
      }
    } catch (e) {
      // TODO: Handle error
    }

    const onMessage = channelConfig.onMessage
    if (!processed && onMessage) {
      await runFunction(services, channelHandler, onMessage, data)
    }

    if (!processed) {
      // TODO: Do we respond with an error to frontend or fail silently?
      logger.error('No message handler or default message route found for message:', data)
    }
  })
}
