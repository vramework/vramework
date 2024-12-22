import { CoreSingletonServices, CoreServices, CoreUserSession } from "@vramework/core"
import { APIGatewayProxyResult } from "aws-lambda"
import { VrameworkAPIGatewayLambdaResponse } from "../vramework-api-gateway-lambda-response.js"
import { runChannelConnect } from "@vramework/core/channel/serverless"
import { getServerlessDependencies } from "./utils.js"
import { WebsocketParams } from "./websocket-types.js"
import { VrameworkAPIGatewayLambdaRequest } from "../vramework-api-gateway-lambda-request.js"

export const connectWebsocket = async <SingletonServices extends CoreSingletonServices, Services extends CoreServices<SingletonServices>, UserSession extends CoreUserSession>({
  event,
  singletonServices,
  createSessionServices,
  channelStore,
  subscriptionStore,
}: WebsocketParams<SingletonServices, Services, UserSession>): Promise<APIGatewayProxyResult> => {
  const runnerParams = getServerlessDependencies(singletonServices.logger, channelStore, subscriptionStore, event)
  const request = new VrameworkAPIGatewayLambdaRequest(event)
  const response = new VrameworkAPIGatewayLambdaResponse()
  await runChannelConnect({
      ...runnerParams,
      request,
      response,
      singletonServices,
      createSessionServices: createSessionServices as any,
      route: event.path || '/',
    })
  return response.getLambdaResponse()
}