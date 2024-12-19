import { CoreSingletonServices, CoreServices, CreateSessionServices, CoreUserSession } from "@vramework/core"
import { runChannelDisconnect, ServerlessChannelStore } from "@vramework/core/channel/serverless"
import { APIGatewayProxyEvent } from "aws-lambda"
import { getServerlessDependencies } from "./utils.js"

export const vrameworkDisconnectHandler = async <SingletonServices extends CoreSingletonServices, Services extends CoreServices<SingletonServices>, UserSession extends CoreUserSession>(
  event: APIGatewayProxyEvent,
  channelStore: ServerlessChannelStore,
  singletonServices: SingletonServices,
  createSessionServices: CreateSessionServices<
    SingletonServices,
    UserSession,
    Services
  >,
): Promise<void> => {
  const runnerParams = getServerlessDependencies(singletonServices.logger, channelStore, event)
  await runChannelDisconnect({
    ...runnerParams,
    singletonServices,
    createSessionServices: createSessionServices as any
  })
}
