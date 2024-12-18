import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";
import { Logger } from "@vramework/core/services";

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