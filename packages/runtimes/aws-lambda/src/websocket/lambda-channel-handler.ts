import { CoreUserSession } from "@pikku/core";
import { ChannelStore, PikkuAbstractChannelHandler, PikkuChannelHandlerFactory } from "@pikku/core/channel";
import { sendMessage } from "./utils.js";
import { ApiGatewayManagementApiClient } from "@aws-sdk/client-apigatewaymanagementapi";
import { Logger } from "@pikku/core/services";

class LambdaChannelHandler<
  UserSession extends CoreUserSession = CoreUserSession,
  OpeningData = unknown,
  Out = unknown,
> extends PikkuAbstractChannelHandler<UserSession, OpeningData, Out> {
  constructor(private logger: Logger, userSession: UserSession | undefined, private channelStore: ChannelStore, private callbackAPI: ApiGatewayManagementApiClient, channelId: string, channelName: string, openingData: OpeningData) {
    super(channelId, channelName, userSession, openingData)
  }

  public async setUserSession(userSession: UserSession): Promise<void> {
    this.userSession = userSession
    await this.channelStore.setUserSession(this.channelId, userSession)
  }

  public async send(message: Out, isBinary?: boolean) {
    if (isBinary) {
      throw new Error("Binary data is not supported on serverless lambdas")
    }
    const data = JSON.stringify(message)
    await sendMessage(this.logger, this.callbackAPI, this.channelId, data)
  }
}

export const createLambdaChannelHandlerFactory = (logger: Logger, channelStore: ChannelStore, callbackAPI: ApiGatewayManagementApiClient) => {
  const factory: PikkuChannelHandlerFactory = (channelId, channelName, openingData, userSession) => new LambdaChannelHandler(logger, userSession, channelStore, callbackAPI, channelId, channelName, openingData)
  return factory
}
