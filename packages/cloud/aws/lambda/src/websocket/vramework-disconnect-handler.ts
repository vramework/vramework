import { CoreSingletonServices, CoreServices, CreateSessionServices, CoreUserSession } from "@vramework/core"
import { runChannelDisconnect, ServerlessChannelStore } from "@vramework/core/channel/serverless"
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { getServerlessDependencies } from "./utils.js"

export const vrameworkDisconnectHandler = async <SingletonServices extends CoreSingletonServices, Services extends CoreServices<SingletonServices>, UserSession extends CoreUserSession>(
  event: APIGatewayProxyEvent,
  channelStore: ServerlessChannelStore,
  singletonServices: SingletonServices,
  createSessionServices: CreateSessionServices<
    SingletonServices,
    Services,
    UserSession
  >,
): Promise<APIGatewayProxyResult> => {
  const runnerParams = getServerlessDependencies(singletonServices.logger, channelStore, event)
  await runChannelDisconnect({
    ...runnerParams,
    singletonServices,
    createSessionServices: createSessionServices as any
  })
  return { statusCode: 200, body: '' }
}
