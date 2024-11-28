import { loadSchema, validateJson } from '../schema.js'
import {
  CoreSingletonServices,
  CoreServices,
  CoreUserSession,
  JSONValue,
} from '../types/core.types.js'
import { CoreAPIStream } from './stream.types.js'
import { getStreams } from './stream-runner.js'
import { VrameworkStream } from './vramework-stream.js'

const validateSchema = (
  logger: CoreSingletonServices['logger'],
  routingProperty: string,
  routerValue: string,
  data: JSONValue
) => {
  const { streamsMeta } = getStreams()
  const schemaName = streamsMeta.find(
    (streamMeta) => streamMeta.messageRoutes[routingProperty]?.[routerValue]
  )?.input
  if (schemaName) {
    loadSchema(schemaName, logger)
    validateJson(schemaName, data)
  }
}

export const registerMessageHandlers = (
  streamConfig: CoreAPIStream<any, any>,
  stream: VrameworkStream<unknown>,
  services: CoreServices,
  userSession?: CoreUserSession
) => {
  stream.registerOnMessage(async (data) => {
    let processed = false
    try {
      if (streamConfig.onMessageRoute && typeof data === 'string') {
        processed = true
        const messageData = JSON.parse(data)
        const routingProperties = Object.keys(streamConfig.onMessageRoute).filter(key => key !== 'default')
        for (const routingProperty of routingProperties) {
          const routerValue: string = messageData[routingProperty]
          if (routerValue) {
            const handler = streamConfig.onMessageRoute[routingProperty][routerValue]
            validateSchema(services.logger, routingProperty, routerValue, messageData)
            const func: any = typeof handler === 'function' ? handler : handler.func
            await func(
              services,
              stream,
              userSession!
            )
          }
        }
      }
    } catch (e) {
      // TODO: Handle error
    }

    const onMessage = streamConfig.onMessage
    if (!processed && onMessage) {
      const func: any = typeof onMessage === 'function' ? onMessage : onMessage.func
      await func(services, stream, userSession!)
    }

    if (!processed) {
      // TODO: Do we log an error here or respond with one?
    }
  })
}
