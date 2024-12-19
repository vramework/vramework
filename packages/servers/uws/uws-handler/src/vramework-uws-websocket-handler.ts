import * as uWS from 'uWebSockets.js'
import {
  logChannels,
} from '@vramework/core/channel'
import {
  runLocalChannel,
  VrameworkLocalChannelHandler
} from '@vramework/core/channel/local'
import { loadAllSchemas } from '@vramework/core/schema'

import { VrameworkUWSRequest } from './vramework-uws-request.js'
import { VrameworkUWSResponse } from './vramework-uws-response.js'
import { VrameworkuWSHandlerOptions } from './vramework-uws-http-handler.js'
import { UWSSubscriptionService } from './uws-subscription-service.js'

const isSerializable = (data: any): boolean => {
  return !(
    typeof data === 'string' ||
    data instanceof ArrayBuffer ||
    data instanceof Uint8Array ||
    data instanceof Int8Array ||
    data instanceof Uint16Array ||
    data instanceof Int16Array ||
    data instanceof Uint32Array ||
    data instanceof Int32Array ||
    data instanceof Float32Array ||
    data instanceof Float64Array
  )
}

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
  subscriptionService = new UWSSubscriptionService(),
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

        const request = new VrameworkUWSRequest(req, res)
        const response = new VrameworkUWSResponse(res)

        const channelHandler = await runLocalChannel({
          channelId: crypto.randomUUID().toString(),
          request,
          response,
          singletonServices,
          subscriptionService,
          createSessionServices,
          route: req.getUrl() as string,
        })

        if (upgradeAborted.aborted) {
          return
        }

        if (!channelHandler) {
          // Not authenticated / channel setup didn't go through
          return
        }

        res.cork(() => {
          res.upgrade(
            { url, channelHandler },
            secWebSocketKey,
            secWebSocketProtocol,
            secWebSocketExtensions,
            context
          )
        })
      } catch (e: any) {
        // Error should have already been handled by runHTTPRoute
      }
    },
    open: (ws) => {
      const { channelHandler } = ws.getUserData()
      channelHandler.registerOnSend((data) => {
        if (isSerializable(data)) {
          ws.send(JSON.stringify(data))
        } else {
          ws.send(data as any)
        }
      })
      subscriptionService.onChannelOpened(channelHandler.channelId, ws)
      channelHandler.open()
    },
    message: async (ws, message, isBinary) => {
      const { channelHandler } = ws.getUserData()
      const data = isBinary ? message : decoder.decode(message)
      const result = await channelHandler.message(data)
      if (result) {
        // TODO: This doesn't deal with binary results
        ws.send(JSON.stringify(result))
      }
    },
    close: (ws) => {
      const { channelHandler } = ws.getUserData()
      subscriptionService.onChannelClosed(channelHandler.channelId)
      channelHandler.close()
    },
  } as uWS.WebSocketBehavior<{ channelHandler: VrameworkLocalChannelHandler }>
}
