import { CoreSingletonServices, CoreServices, CreateSessionServices, CoreUserSession } from "@vramework/core"
import { runChannelDisconnect, ServerlessWebsocketStore } from "@vramework/core/channel/serverless"
import { APIGatewayProxyEvent } from "aws-lambda"
import { getServerlessDependencies } from "./utils.js"

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
  const runnerParams = getServerlessDependencies(singletonServices.logger, serverlessWebsocketStore, event)
  try {
    await runChannelDisconnect({
      ...runnerParams,
      singletonServices,
      createSessionServices: createSessionServices as any
    })
  } catch {
    // Error should have already been handled by runHTTPRoute
  }
}
