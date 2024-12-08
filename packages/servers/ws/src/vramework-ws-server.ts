import { Server } from 'http'
import { WebSocket, WebSocketServer, Data } from 'ws'
import { runChannel, logChannels } from '@vramework/core/channel'

import { loadAllSchemas } from '@vramework/core/schema'
import { RunRouteOptions } from '@vramework/core/http'
import { VrameworkChannelHandler } from '@vramework/core/channel/vramework-channel-handler'
import { VrameworkHTTPRequest } from './vramework-http-request.js'
import { VrameworkDuplexResponse } from './vramework-duplex-response.js'
import { CoreSingletonServices, CreateSessionServices } from '@vramework/core/src/types/core.types.js'

/**
 * Options for configuring the `vrameworkHandler`.
 *
 * @typedef {Object} VrameworkuWSHandlerOptions
 * @property {CoreSingletonServices} singletonServices - The singleton services used by the handler.
 * @property {CreateSessionServices<any, any, any>} createSessionServices - A function to create session services.
 * @property {boolean} [logRoutes] - Whether to log the routes.
 * @property {boolean} [loadSchemas] - Whether to load all schemas.
 * @property {RunRouteOptions} - Additional options for running the route.
 */
export type VrameworkWSHandlerOptions = {
  server: Server
  wss: WebSocketServer
  singletonServices: CoreSingletonServices
  createSessionServices: CreateSessionServices<any, any, any>
  logRoutes?: boolean
  loadSchemas?: boolean
} & RunRouteOptions

const isSerializable = (data: any): boolean => {
  // Check if the data is any kind of Buffer-like object
  if (
    typeof data === 'string' ||
    data instanceof ArrayBuffer ||
    data instanceof Uint8Array ||
    data instanceof Int8Array ||
    data instanceof Uint16Array ||
    data instanceof Int16Array ||
    data instanceof Uint32Array ||
    data instanceof Int32Array ||
    data instanceof Float32Array ||
    data instanceof Float64Array ||
    data instanceof DataView ||
    data instanceof SharedArrayBuffer ||
    (Array.isArray(data) && data.some(item => item instanceof Buffer))
  ) {
    return false; // Not serializable (binary or buffer-like)
  }

  // Allow primitive objects and objects that are not binary-like
  return true;
}

/**
 * Creates a WebSocket handler for handling requests using the `@vramework/core` framework.
 *
 * @param {VrameworkuWSHandlerOptions} options - The options to configure the handler.
 * @returns {Function} - The WebSocket request handler function.
 */
export const vrameworkWebsocketHandler = ({
  server,
  wss,
  singletonServices,
  createSessionServices,
  loadSchemas,
  logRoutes,
}: VrameworkWSHandlerOptions) => {
  if (logRoutes) {
    logChannels(singletonServices.logger)
  }

  if (loadSchemas) {
    loadAllSchemas(singletonServices.logger)
  }

  const onConnect = async (ws: WebSocket, channelHandler: VrameworkChannelHandler) => {
    // Set up the WebSocket events
    ws.on('open', () => {
      channelHandler.registerOnSend((data) => {
        if (isSerializable(data)) {
          ws.send(JSON.stringify(data))
        } else {
          ws.send(data as any)
        }
      })
      channelHandler.open()
    })

    ws.on('message', (message: Data) => {
      channelHandler.message(message)
    })

    ws.on('close', () => {
      channelHandler.close()
    })
  }

  server.on('upgrade', async (req, socket, head) => {
    // Handle WebSocket connection upgrade
    const url = req.url || ''
    const request = new VrameworkHTTPRequest(req)
    const response = new VrameworkDuplexResponse(socket)

    // Initialize the channel handler
    const channelHandler = await runChannel({
      request,
      response,
      singletonServices,
      createSessionServices: createSessionServices as any,
      channel: url,
    })

    if (!channelHandler) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      onConnect(ws, channelHandler)
    })
  })
}
