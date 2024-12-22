import { CoreSingletonServices, CoreServices, CoreUserSession, CreateSessionServices } from "@vramework/core"
import { ServerlessChannelStore, ServerlessSubscriptionStore } from "@vramework/core/channel/serverless"
import { APIGatewayProxyEvent } from "aws-lambda"

export type WebsocketParams<SingletonServices extends CoreSingletonServices, Services extends CoreServices<SingletonServices>, UserSession extends CoreUserSession> = {
    event: APIGatewayProxyEvent,
    channelStore: ServerlessChannelStore,
    subscriptionStore: ServerlessSubscriptionStore,
    singletonServices: SingletonServices,
    createSessionServices: CreateSessionServices<
      SingletonServices,
      Services,
      UserSession
    >
}