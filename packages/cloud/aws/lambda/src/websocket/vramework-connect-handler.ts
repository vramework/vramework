import { CoreSingletonServices, CoreServices, CreateSessionServices, CoreUserSession } from "@vramework/core"
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { VrameworkAPIGatewayLambdaRequest } from "../vramework-api-gateway-lambda-request.js"
import { VrameworkAPIGatewayLambdaResponse } from "../vramework-api-gateway-lambda-response.js"
import { runChannelConnect, ServerlessChannelStore } from "@vramework/core/channel/serverless"
import { getServerlessDependencies } from "./utils.js"

export const vrameworkConnectHandler = async <SingletonServices extends CoreSingletonServices, Services extends CoreServices<SingletonServices>, UserSession extends CoreUserSession>(
  event: APIGatewayProxyEvent,
  channelStore: ServerlessChannelStore,
  singletonServices: SingletonServices,
  createSessionServices: CreateSessionServices<
    SingletonServices,
    Services,
    UserSession
  >
): Promise<APIGatewayProxyResult> => {
  const runnerParams = getServerlessDependencies(singletonServices.logger, channelStore, event)
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