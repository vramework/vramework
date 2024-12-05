import * as uWS from 'uWebSockets.js'
import { runChannel } from '@vramework/core/channel/channel-runner'
import { logChannels } from '@vramework/core/channel/log-channels'
import { VrameworkChannel } from '@vramework/core/channel/vramework-channel'

import { VrameworkUWSRequest } from './vramework-uws-request.js'
import { VrameworkUWSResponse } from './vramework-uws-response.js'
import { loadAllSchemas } from '@vramework/core/schema'
import { VrameworkuWSHandlerOptions } from './vramework-uws-http-handler.js'

/**
 * Creates a uWebSockets handler for handling requests using the `@vramework/core` framework.
 *
 * @param {VrameworkuWSHandlerOptions} options - The options to configure the handler.
 * @returns {Function} - The request handler function.
 */
export const vrameworkWebsocketHandler = ({
  singletonServices,
  createSessionServices,
  loadSchemas,
  logRoutes,
}: VrameworkuWSHandlerOptions) => {
  if (logRoutes) {
    logChannels(singletonServices.logger)
  }

  if (loadSchemas) {
    loadAllSchemas(singletonServices.logger)
  }

  const decoder = new TextDecoder('utf-8')

  return {
    upgrade: async (res, req, context) => {
      /* Keep track of abortions */
      const upgradeAborted = { aborted: false }

      res.onAborted(() => {
        upgradeAborted.aborted = true
      })

      try {
        /* You MUST copy data out of req here, as req is only valid within this immediate callback */
        const url = req.getUrl()
        const secWebSocketKey = req.getHeader('sec-websocket-key')
        const secWebSocketProtocol = req.getHeader('sec-websocket-protocol')
        const secWebSocketExtensions = req.getHeader('sec-websocket-extensions')

        const stream = await runChannel({
          request: new VrameworkUWSRequest(req, res),
          response: new VrameworkUWSResponse(res),
          singletonServices,
          createSessionServices,
          channel: req.getUrl() as string,
        })

        if (upgradeAborted.aborted) {
          return
        }

        res.cork(() => {
          res.upgrade(
            { url, stream },
            secWebSocketKey,
            secWebSocketProtocol,
            secWebSocketExtensions,
            context
          )
        })
      } catch (e: any) {
        // Error should have already been handled by runRoute
      }
    },
    open: (ws) => {
      const { stream } = ws.getUserData()
      stream.registerOnSend(data => {
        if (typeof data === 'object') {
          ws.send(JSON.stringify(data))
        } else {
          ws.send(data)
        }
      })
      stream.open()
    },
    message: (ws, message, isBinary) => {
      const { stream } = ws.getUserData()
      const data = isBinary ? message : decoder.decode(message)
      stream.message(data)
    },
    close: (ws) => {
      const { stream } = ws.getUserData()
      stream.close()
    },
  } as uWS.WebSocketBehavior<{ stream: VrameworkChannel }>
}
