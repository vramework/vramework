import { CoreSingletonServices, CoreServices, CoreUserSession } from "@vramework/core"
import { runChannelDisconnect } from "@vramework/core/channel/serverless"
import { APIGatewayProxyResult } from "aws-lambda"
import { getServerlessDependencies } from "./utils.js"
import { WebsocketParams } from "./websocket-types.js"

export const disconnectWebsocket = async <SingletonServices extends CoreSingletonServices, Services extends CoreServices<SingletonServices>, UserSession extends CoreUserSession>({
  event,
  singletonServices,
  createSessionServices,
  channelStore,
  subscriptionStore,
}: WebsocketParams<SingletonServices, Services, UserSession>): Promise<APIGatewayProxyResult> => {
  const runnerParams = getServerlessDependencies(singletonServices.logger, channelStore, subscriptionStore, event)
  await runChannelDisconnect({
    ...runnerParams,
    singletonServices,
    createSessionServices: createSessionServices as any
  })
  return { statusCode: 200, body: '' }
}
