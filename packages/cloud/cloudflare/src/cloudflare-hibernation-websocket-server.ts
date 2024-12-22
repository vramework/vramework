import { DurableObjectState, DurableObject, Request, WebSocket } from "@cloudflare/workers-types";
import { runChannelConnect, runChannelMessage } from "@vramework/core/channel/serverless";
import { CloudflareHTTPRequest } from "./cloudflare-http-request.js";
import { CloudfrontHTTPResponse } from "./cloudflare-http-response.js";
import { CloudflareWebsocketStore } from "./cloudflare-channel-store.js";
import { LocalSubscriptionService } from "@vramework/core/channel/local";
import { createCloudflareChannelHandlerFactory } from "./cloudflare-channel-handler-factory.js";

export abstract class CloudflareWebSocketHibernationServer implements DurableObject {
  constructor(private ctx: DurableObjectState, protected env: Record<string, string | undefined>) {
  }

  public async fetch(cloudflareRequest: Request) {    
    // @ts-ignore
    const webSocketPair = new WebSocketPair();
    const client: WebSocket = webSocketPair[0];
    const server: WebSocket = webSocketPair[1];

    const request = new CloudflareHTTPRequest(cloudflareRequest as any)
    const response = new CloudfrontHTTPResponse(client)

    const channelId = crypto.randomUUID().toString()
    const params = await this.getAllParams(server)

    try {
      await runChannelConnect({
        ...params,
        channelId,
        channelObject: server,
        route: request.getPath(),
        request,
        response,
        bubbleErrors: true
      })
      this.ctx.acceptWebSocket(server, [channelId])
    } catch (e) {
      // Something went wrong, the cloudflare response will deal with it.
      console.error(e)
    }

    return response.getCloudflareResponse() as any
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    const params = await this.getAllParams(ws)
    const channelId = this.ctx.getTags(ws)[0]!
    const result = await runChannelMessage({
      ...params,
      channelId
    }, message)
    if (result) {
      // We don't send binary results
      ws.send(JSON.stringify(result))
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean,) {
    // const params = await this.getAllParams(ws)
    // const channelId = this.ctx.getTags(ws)[0]!
    // await runChannelDisconnect({
    //   ...params,
    //   channelId
    // })
  }

  private async getAllParams (websocket: WebSocket) {
    const params = await this.getParams()
    const channelStore = new CloudflareWebsocketStore(this.ctx)
    const channelHandlerFactory = createCloudflareChannelHandlerFactory(params.singletonServices.logger, channelStore, websocket)
    const subscriptionService = new LocalSubscriptionService()
    return {
      ...params,
      channelStore,
      subscriptionService,
      channelHandlerFactory,
    }
  }

  protected abstract getParams: () => Promise<{
    singletonServices: any,
    createSessionServices: any
  }> 
}