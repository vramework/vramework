import { loadSchema, validateJson } from '../schema.js'
import {
  CoreSingletonServices,
  CoreStreamServices,
  CoreUserSession,
} from '../types/core.types.js'
import { CoreAPIStreamMessage, CoreAPIStream } from './stream.types.js'
import { getStreams } from './stream-runner.js'
import { VrameworkStream } from './vramework-stream.js'

const getMatchingHandler = (
  logger: CoreSingletonServices['logger'],
  messages: Array<CoreAPIStreamMessage>,
  messageTopic: string
) => {
  const streamsMeta = getStreams().streamsMeta

  for (const message of messages) {
    if (message.route === messageTopic) {
      const schemaName = streamsMeta.find(
        (streamMeta) => streamMeta.route === message.route
      )?.input
      if (schemaName) {
        loadSchema(schemaName, logger)
      }
      return { message, schemaName }
    }
  }

  throw new Error('Handler not found')
}

export const registerMessageHandlers = (
  streamConfig: CoreAPIStream<any, any>,
  stream: VrameworkStream<unknown>,
  services: CoreStreamServices,
  userSession?: CoreUserSession
) => {
  stream.registerOnMessage(async (data) => {
    let processed = false
    try {
      if (typeof data === 'string') {
        processed = true
        const messageData = JSON.parse(data)
        if (messageData.topic) {
          processed = true
          const { schemaName, message } = getMatchingHandler(
            services.logger,
            streamConfig.onMessage,
            messageData.topic
          )
          if (schemaName) {
            validateJson(schemaName, messageData.data)
          }
          await message.func(services, messageData.data, userSession!)
        }
      }
    } catch (e) {
      // TODO: Handle error
    }

    if (!processed) {
      // TODO: Process using default handler
    }
  })
}
