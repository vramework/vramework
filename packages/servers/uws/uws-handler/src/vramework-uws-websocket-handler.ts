import * as uWS from 'uWebSockets.js'
import { runStream } from '@vramework/core/stream/stream-runner'
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
}: VrameworkuWSHandlerOptions) => {
  if (loadSchemas) {
    loadAllSchemas(singletonServices.logger)
  }

  const stream = new VrameworkStream()

  return {
    upgrade: async (res, req, context) => {
      /* Keep track of abortions */
      const upgradeAborted = { aborted: false };

      /* You MUST copy data out of req here, as req is only valid within this immediate callback */
      const url = req.getUrl();
      const secWebSocketKey = req.getHeader('sec-websocket-key');
      const secWebSocketProtocol = req.getHeader('sec-websocket-protocol');
      const secWebSocketExtensions = req.getHeader('sec-websocket-extensions');

      res.onAborted(() => {
        upgradeAborted.aborted = true;
      })

      await runStream({
        request: new VrameworkUWSRequest(req, res),
        response: new VrameworkUWSResponse(res),
        stream,
        singletonServices,
        createSessionServices,
        route: req.getUrl() as string,
      })

      if (upgradeAborted.aborted) {
        console.log("Client disconnected before we could upgrade it");
        return
      }

      res.cork(() => {
        res.upgrade(
          { url: url },
          secWebSocketKey,
          secWebSocketProtocol,
          secWebSocketExtensions,
          context
        );
      });
    },
    open: (ws) => {
      stream.onSend(ws.send.bind(ws))
      stream.open()
    },
    message: (ws, message, isBinary) => {
      stream.message(message)
    },
    close: () => {
      stream.close()
    }
  } as uWS.WebSocketBehavior<unknown>
}
