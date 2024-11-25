import * as uWS from 'uWebSockets.js'
import { runStream } from '@vramework/core/stream/stream-runner'
import { logStreams } from '@vramework/core/stream/log-streams'
import { VrameworkStream } from '@vramework/core/stream/vramework-stream'

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
  logRoutes
}: VrameworkuWSHandlerOptions) => {
  if (logRoutes) {
    logStreams(singletonServices.logger)
  }

  if (loadSchemas) {
    loadAllSchemas(singletonServices.logger)
  }

  const decoder = new TextDecoder("utf-8")

  return {
    upgrade: async (res, req, context) => {
      /* Keep track of abortions */
      const upgradeAborted = { aborted: false }

      res.onAborted(() => {
        upgradeAborted.aborted = true;
      })

      try {
        /* You MUST copy data out of req here, as req is only valid within this immediate callback */
        const url = req.getUrl();
        const secWebSocketKey = req.getHeader('sec-websocket-key');
        const secWebSocketProtocol = req.getHeader('sec-websocket-protocol');
        const secWebSocketExtensions = req.getHeader('sec-websocket-extensions');
       
        const stream = await runStream({
          request: new VrameworkUWSRequest(req, res),
          response: new VrameworkUWSResponse(res),
          singletonServices,
          createSessionServices,
          route: req.getUrl() as string,
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
          );
        });
      } catch (e: any) {
        // Error should have already been handled by runRoute
      }
    },
    open: (ws) => {
      const { stream } = ws.getUserData()
      stream.registerOnSend(ws.send.bind(ws))
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
    }
  } as uWS.WebSocketBehavior<{ stream: VrameworkStream }>
}
