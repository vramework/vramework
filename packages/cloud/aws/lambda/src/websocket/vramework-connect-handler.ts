import { CoreSingletonServices, CoreServices, CreateSessionServices, CoreUserSession } from "@vramework/core"
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { VrameworkAPIGatewayLambdaRequest } from "../vramework-api-gateway-lambda-request.js"
import { VrameworkAPIGatewayLambdaResponse } from "../vramework-api-gateway-lambda-response.js"
import { runChannelConnect, ServerlessWebsocketStore } from "@vramework/core/channel/serverless"
import { lambdaChannelHandlerFactory } from "./lambda-channel-handler.js"

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
  const channelId = event.requestContext.connectionId
  if (!channelId) {
    throw new Error('No connectionId found in requestContext')
  }
  const request = new VrameworkAPIGatewayLambdaRequest(event)
  const response = new VrameworkAPIGatewayLambdaResponse()
  try {
    await runChannelConnect({
      channelId,
      request,
      response,
      channelHandlerFactory: lambdaChannelHandlerFactory,
      subscriptionService: serverlessWebsocketStore.getSubscriptionService(),
      serverlessWebsocketStore,
      singletonServices,
      createSessionServices: createSessionServices as any,
      channel: request.getPath(),
    })
  } catch {
    // Error should have already been handled by runHTTPRoute
  }
  return response.getLambdaResponse()
}