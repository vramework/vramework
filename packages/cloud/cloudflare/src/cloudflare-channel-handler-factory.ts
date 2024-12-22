import { CoreUserSession } from "@vramework/core";
import { SubscriptionService, VrameworkAbstractChannelHandler, VrameworkChannelHandlerFactory } from "@vramework/core/channel";
import { Logger } from "@vramework/core/services";
import { ServerlessChannelStore } from "@vramework/core/channel/serverless";
import { WebSocket } from "@cloudflare/workers-types";

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

class CloudflareChannelHandler<
  UserSession extends CoreUserSession = CoreUserSession,
  OpeningData = unknown,
  Out = unknown,
> extends VrameworkAbstractChannelHandler<UserSession, OpeningData, Out> {
  constructor(
    channelId: string, 
    openingData: OpeningData, 
    userSession: UserSession | undefined, 
    subscriptionService: SubscriptionService<Out>, 
    private websocket: WebSocket,
    _logger: Logger, 
    private channelStore: ServerlessChannelStore, 
  ) {
    super(channelId, userSession, openingData, subscriptionService)
  }

  public async setUserSession(userSession: UserSession): Promise<void> {
    this.getChannel().userSession = userSession
    await this.channelStore.setUserSession(this.channelId, userSession)
  }

  public async send(message: Out, isBinary?: boolean) {
    if (isBinary) {
      throw new Error("Binary data is not supported on serverless")
    }
    if (isSerializable(message)) {
        this.websocket.send(JSON.stringify(message))
    } else {
        this.websocket.send(message as any)
    }
  }
}

export const createCloudflareChannelHandlerFactory = (logger: Logger, channelStore: ServerlessChannelStore, websocket: WebSocket) => {
  const factory: VrameworkChannelHandlerFactory = (channelId, openingData, userSession, subscriptionService) => new CloudflareChannelHandler(channelId, openingData, userSession, subscriptionService, websocket, logger, channelStore)
  return factory
}
