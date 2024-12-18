import { CoreUserSession } from "@vramework/core";
import { SubscriptionService, VrameworkAbstractChannelHandler, VrameworkChannel, VrameworkChannelHandlerFactory } from "@vramework/core/channel";

class LambdaChannelHandler<
  UserSession extends CoreUserSession = CoreUserSession,
  OpeningData = unknown,
  Out = unknown,
> extends VrameworkAbstractChannelHandler<UserSession, OpeningData, Out> {
  constructor (channelId: string, openingData: OpeningData, subscriptionService: SubscriptionService<Out>) {
    super(channelId, openingData, subscriptionService)
  }

  public setSession(session: UserSession): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public getChannel(): VrameworkChannel<UserSession, OpeningData, Out> {
    throw new Error("Method not implemented.");
  }

  public async send(message: Out, isBinary?: boolean) {

  }
}

export const lambdaChannelHandlerFactory: VrameworkChannelHandlerFactory = (channelId, openingData, subscriptionService) => {
  return new LambdaChannelHandler(channelId, openingData, subscriptionService)
}
