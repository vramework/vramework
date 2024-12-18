import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";
import { Logger } from "@vramework/core/services";
import { APIGatewayEvent } from "aws-lambda";
import { VrameworkLambdaSubscriptionService } from "./vramework-lambda-subscription-service.js";
import { ServerlessWebsocketStore } from "@vramework/core/channel/serverless";
import { createLambdaChannelHandlerFactory } from "./lambda-channel-handler.js";

export const sendMessage = async (logger: Logger, callbackAPI: ApiGatewayManagementApiClient, ConnectionId: string, Data: string) => {
    try {
        await callbackAPI.send(new PostToConnectionCommand({ ConnectionId, Data }))
    } catch (e) {
        logger.error(e);
    }
}

export const sendMessages = async (logger: Logger, callbackAPI: ApiGatewayManagementApiClient, fromChannelId: string, channelIds: string[], data: unknown, isBinary?: boolean) => {
    if (isBinary) {
        throw new Error("Binary data is not supported on serverless lambdas")
    }
    const Data = JSON.stringify(data)
    try {
        await Promise.all(channelIds.map(async (channelId) => {
            if (channelId !== fromChannelId) {
                await sendMessage(logger, callbackAPI, channelId, Data)
            }
        }))
    } catch (e) {
        logger.error(e);
    }
}

export const getServerlessDependencies = (logger: Logger, serverlessWebsocketStore: ServerlessWebsocketStore,  event: APIGatewayEvent) => {
    const channelId = event.requestContext.connectionId
      if (!channelId) {
        throw new Error('No connectionId found in requestContext')
      }
      console.log('event.requestContext', `https://${event.requestContext.domainName}/${event.requestContext.stage}`)
      const callbackAPI = new ApiGatewayManagementApiClient({
        apiVersion: '2018-11-29',
        // endpoint: `http://localhost:3001`
        endpoint: `https://${event.requestContext.domainName}/${event.requestContext.stage}`,
      })
      const subscriptionService = new VrameworkLambdaSubscriptionService(logger, serverlessWebsocketStore, callbackAPI)
      const channelHandlerFactory = createLambdaChannelHandlerFactory(logger, serverlessWebsocketStore, callbackAPI)
      return { channelId, callbackAPI, subscriptionService, channelHandlerFactory, serverlessWebsocketStore }
}