import { CoreUserSession } from "@vramework/core";
import { SubscriptionService, VrameworkAbstractChannelHandler, VrameworkChannelHandlerFactory } from "@vramework/core/channel";
import { sendMessage } from "./utils.js";
import { ApiGatewayManagementApiClient } from "@aws-sdk/client-apigatewaymanagementapi";
import { Logger } from "@vramework/core/services";
import { ServerlessChannelStore } from "@vramework/core/channel/serverless";

class LambdaChannelHandler<
  UserSession extends CoreUserSession = CoreUserSession,
  OpeningData = unknown,
  Out = unknown,
> extends VrameworkAbstractChannelHandler<UserSession, OpeningData, Out> {
  constructor(private logger: Logger, userSession: UserSession, private channelStore: ServerlessChannelStore, private callbackAPI: ApiGatewayManagementApiClient, channelId: string, openingData: OpeningData, subscriptionService: SubscriptionService<Out>) {
    super(channelId, userSession, openingData, subscriptionService)
  }

  public async setSession(session: UserSession): Promise<void> {
    this.userSession = session
    await this.channelStore.setSession(this.channelId, session)
  }

  public async send(message: Out, isBinary?: boolean) {
    if (isBinary) {
      throw new Error("Binary data is not supported on serverless lambdas")
    }
    const data = JSON.stringify(message)
    await sendMessage(this.logger, this.callbackAPI, this.channelId, data)
  }
}

export const createLambdaChannelHandlerFactory = (logger: Logger, channelStore: ServerlessChannelStore, callbackAPI: ApiGatewayManagementApiClient) => {
  const factory: VrameworkChannelHandlerFactory = (channelId, openingData, userSession, subscriptionService) => new LambdaChannelHandler(logger, userSession, channelStore, callbackAPI, channelId, openingData, subscriptionService)
  return factory
}
