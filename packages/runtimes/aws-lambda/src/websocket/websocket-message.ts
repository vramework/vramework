import { CoreSingletonServices, CoreServices, CoreUserSession } from "@pikku/core"
import { runChannelMessage } from "@pikku/core/channel/serverless"
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { PikkuAPIGatewayLambdaResponse } from "../pikku-api-gateway-lambda-response.js"
import { getServerlessDependencies } from "./utils.js"
import { WebsocketParams } from "./websocket-types.js"

export const processWebsocketMessage = async <SingletonServices extends CoreSingletonServices, Services extends CoreServices<SingletonServices>, UserSession extends CoreUserSession>(event: APIGatewayProxyEvent, {
  singletonServices,
  createSessionServices,
  channelStore,
}: WebsocketParams<SingletonServices, Services, UserSession>): Promise<APIGatewayProxyResult> => {
  const runnerParams = getServerlessDependencies(singletonServices.logger, channelStore, event)
  const response = new PikkuAPIGatewayLambdaResponse()
  try {
    const result = await runChannelMessage({
      ...runnerParams,
      singletonServices: singletonServices as any,
      createSessionServices: createSessionServices as any
    }, event.body)
    if (result) {
      // TODO: Support non json
      response.setJson(result as any)
    }
  } catch (e) {
    // Error should have already been handled by runHTTPRoute
    console.error(e)
  }
  return response.getLambdaResponse()
}