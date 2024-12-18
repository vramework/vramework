import { CoreSingletonServices, CoreServices, CreateSessionServices, CoreUserSession } from "@vramework/core"
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { VrameworkAPIGatewayLambdaRequest } from "../vramework-api-gateway-lambda-request.js"
import { VrameworkAPIGatewayLambdaResponse } from "../vramework-api-gateway-lambda-response.js"
import { runChannelConnect, ServerlessWebsocketStore } from "@vramework/core/channel/serverless"
import { getServerlessDependencies } from "./utils.js"

export const vrameworkConnectHandler = async <SingletonServices extends CoreSingletonServices, Services extends CoreServices<SingletonServices>, UserSession extends CoreUserSession>(
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
  const request = new VrameworkAPIGatewayLambdaRequest(event)
  const response = new VrameworkAPIGatewayLambdaResponse()
  try {
    await runChannelConnect({
      ...runnerParams,
      request,
      response,
      singletonServices,
      createSessionServices: createSessionServices as any,
      channel: request.getPath(),
    })
  } catch {
    // Error should have already been handled by runHTTPRoute
  }
  return response.getLambdaResponse()
}