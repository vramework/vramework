import { CoreSingletonServices, CoreServices, CreateSessionServices, CoreUserSession } from "@vramework/core"
import { runChannelMessage, ServerlessWebsocketStore } from "@vramework/core/channel/serverless"
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { VrameworkAPIGatewayLambdaResponse } from "../vramework-api-gateway-lambda-response.js"
import { lambdaChannelHandlerFactory } from "./lambda-channel-handler.js"

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
  const channelId = event.requestContext.connectionId
  if (!channelId) {
    throw new Error('No connectionId found in requestContext')
  }
  const response = new VrameworkAPIGatewayLambdaResponse()
  try {
    const result = await runChannelMessage({
      channelId,
      channelHandlerFactory: lambdaChannelHandlerFactory,
      subscriptionService: serverlessWebsocketStore.getSubscriptionService(),
      serverlessWebsocketStore,
      singletonServices,
      createSessionServices: createSessionServices as any
    }, event.body)
    // TODO: Serialise result here if it isn't a string
    response.setJson(JSON.stringify(result))
  } catch {
    // Error should have already been handled by runHTTPRoute
  }
  return response.getLambdaResponse()
}