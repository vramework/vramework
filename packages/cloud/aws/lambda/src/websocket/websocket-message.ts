import { CoreSingletonServices, CoreServices, CoreUserSession } from "@vramework/core"
import { runChannelMessage } from "@vramework/core/channel/serverless"
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { VrameworkAPIGatewayLambdaResponse } from "../vramework-api-gateway-lambda-response.js"
import { getServerlessDependencies } from "./utils.js"
import { WebsocketParams } from "./websocket-types.js"

export const processWebsocketMessage = async <SingletonServices extends CoreSingletonServices, Services extends CoreServices<SingletonServices>, UserSession extends CoreUserSession>(event: APIGatewayProxyEvent, {
  singletonServices,
  createSessionServices,
  channelStore,
}: WebsocketParams<SingletonServices, Services, UserSession>): Promise<APIGatewayProxyResult> => {
  const runnerParams = getServerlessDependencies(singletonServices.logger, channelStore, event)
  const response = new VrameworkAPIGatewayLambdaResponse()
  try {
    const result = await runChannelMessage({
      ...runnerParams,
      singletonServices: singletonServices as any,
      createSessionServices: createSessionServices as any
    }, event.body)
    if (result) {
      // TODO: Serialise result here if it isn't a string
      response.setJson(JSON.stringify(result))
    }
  } catch {
    // Error should have already been handled by runHTTPRoute
  }
  return response.getLambdaResponse()
}