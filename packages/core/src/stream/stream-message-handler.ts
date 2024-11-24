import { match } from "path-to-regexp"
import { loadSchema, validateJson } from "../schema.js"
import { CoreSingletonServices, CoreStreamServices, CoreUserSession, VrameworkStream } from "../types/core.types.js"
import { CoreAPIStreamMessage, CoreAPIStream } from "./stream.types.js"
import { getStreams } from "./stream-runner.js"

const getMatchingHandler = (
    logger: CoreSingletonServices['logger'],
    messages: Array<CoreAPIStreamMessage> ,
    messageTopic: string
) => {
    const streamsMeta = getStreams().streamsMeta

    for (const message of messages) {
        const matchFunc = match(message.route.replace(/^\/\//, '/'), {
            decode: decodeURIComponent,
        })
        const matchedPath = matchFunc(messageTopic.replace(/^\/\//, '/'))
        if (matchedPath) {
            const schemaName = streamsMeta.find(
                (streamMeta) => streamMeta.route === message.route
            )?.input
            if (schemaName) {
                loadSchema(schemaName, logger)
            }
            return { matchedPath, params: matchedPath.params, message, schemaName }
        }
    }
    throw new Error('Handler not found')
}

export const registerMessageHandlers = (streamConfig: CoreAPIStream<any, any>, stream: VrameworkStream, services: CoreStreamServices, userSession?: CoreUserSession) => {
    stream.subscribe((data) => {
        let processed = false
        try {
            if (typeof data === 'string') {
                processed = true
                const messageData = JSON.parse(data)
                if (messageData.topic) {
                    processed = true
                    const { schemaName, message } = getMatchingHandler(services.logger, streamConfig.onMessage, messageData.topic)
                    if (schemaName) {
                        validateJson(schemaName, messageData.data)
                    }
                    message.func(services, messageData.data, userSession!)
                }
            }
        } catch (e) {
            processed = true
        }

        if (!processed) {
            // TODO: Process using default handler
        }
    })
}