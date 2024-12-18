import { CoreSingletonServices, CoreServices, CreateSessionServices, CoreUserSession } from "@vramework/core"
import { runChannelMessage, ServerlessWebsocketStore } from "@vramework/core/channel/serverless"
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { VrameworkAPIGatewayLambdaResponse } from "../vramework-api-gateway-lambda-response.js"
import { getServerlessDependencies } from "./utils.js"

export const vrameworkMessageHandler = async <SingletonServices extends CoreSingletonServices, Services extends CoreServices<SingletonServices>, UserSession extends CoreUserSession>(
  event: APIGatewayProxyEvent,
  serverlessWebsocketStore: ServerlessWebsocketStore,
  singletonServices: SingletonServices,
  createSessionServices: CreateSessionServices<
    SingletonServices,
    UserSession,
    Services
  >
): Promise<APIGatewayProxyResult> => {
  const runnerParams = getServerlessDependencies(singletonServices.logger, serverlessWebsocketStore, event)
  const response = new VrameworkAPIGatewayLambdaResponse()
  try {
    const result = await runChannelMessage({
      ...runnerParams,
      singletonServices,
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