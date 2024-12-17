import { CoreSingletonServices, CoreServices, CreateSessionServices, CoreUserSession } from "@vramework/core"
import { runChannelDisconnect, ServerlessWebsocketStore } from "@vramework/core/channel/serverless"
import { APIGatewayProxyEvent } from "aws-lambda"

export const vrameworkDisconnectHandler = async <SingletonServices extends CoreSingletonServices, Services extends CoreServices<SingletonServices>, UserSession extends CoreUserSession>(
  event: APIGatewayProxyEvent,
  serverlessWebsocketStore: ServerlessWebsocketStore,
  singletonServices: SingletonServices,
  createSessionServices: CreateSessionServices<
    SingletonServices,
    UserSession,
    Services
  >,
): Promise<void> => {
  const channelId = event.requestContext.connectionId
  if (!channelId) {
    throw new Error('No connectionId found in requestContext')
  }
  try {
    await runChannelDisconnect({
      channelId,
      subscriptionService: serverlessWebsocketStore.getSubscriptionService(),
      serverlessWebsocketStore,
      singletonServices,
      createSessionServices: createSessionServices as any
    })
  } catch {
    // Error should have already been handled by runHTTPRoute
  }
}