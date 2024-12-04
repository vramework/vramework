import { loadSchema, validateJson } from '../schema.js'
import {
  CoreSingletonServices,
  CoreServices,
  CoreUserSession,
  JSONValue,
} from '../types/core.types.js'
import { CoreAPIChannel } from './channel.types.js'
import { getChannels } from './channel-runner.js'
import { VrameworkChannel } from './vramework-channel.js'

const validateSchema = (
  logger: CoreSingletonServices['logger'],
  routingProperty: string,
  routerValue: string,
  data: JSONValue
) => {
  const { channelsMeta } = getChannels()
  const schemaName = channelsMeta.find(
    (channelsMeta) => channelsMeta.messageRoutes[routingProperty]?.[routerValue]
  )?.input
  if (schemaName) {
    loadSchema(schemaName, logger)
    validateJson(schemaName, data)
  }
}

export const registerMessageHandlers = (
  channelConfig: CoreAPIChannel<any, any>,
  stream: VrameworkChannel<unknown>,
  services: CoreServices,
  userSession?: CoreUserSession
) => {
  stream.registerOnMessage(async (data) => {
    let processed = false
    try {
      if (channelConfig.onMessageRoute && typeof data === 'string') {
        processed = true
        const messageData = JSON.parse(data)
        const routingProperties = Object.keys(
          channelConfig.onMessageRoute
        ).filter((key) => key !== 'default')
        for (const routingProperty of routingProperties) {
          const routerValue: string = messageData[routingProperty]
          if (routerValue) {
            const handler =
              channelConfig.onMessageRoute[routingProperty]![routerValue]
            validateSchema(
              services.logger,
              routingProperty,
              routerValue,
              messageData
            )
            const func: any =
              typeof handler === 'function' ? handler : handler!.func!
            await func(services, stream, userSession!)
          }
        }
      }
    } catch (e) {
      // TODO: Handle error
    }

    const onMessage = channelConfig.onMessage
    if (!processed && onMessage) {
      const func: any =
        typeof onMessage === 'function' ? onMessage : onMessage.func
      await func(services, stream, userSession!)
    }

    if (!processed) {
      // TODO: Do we log an error here or respond with one?
    }
  })
}
