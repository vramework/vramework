import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi'
import { SubscriptionService } from "@vramework/core/channel";
import { ServerlessWebsocketStore } from "@vramework/core/channel/serverless";

export class VrameworkLambdaSubscriptionService<Out = unknown> implements SubscriptionService<Out> {
    constructor(private serverlessWebsocketStore: ServerlessWebsocketStore, private domainName: string, private stage: string) {
    }

    async subscribe(topic: string, channelId: string): Promise<void> {
        await this.serverlessWebsocketStore.subscribe(topic, channelId)
    }

    async unsubscribe(topic: string, channelId: string): Promise<void> {
        await this.serverlessWebsocketStore.unsubscribe(topic, channelId)
    }

    async broadcast(channelId: string, data: Out, isBinary?: boolean): Promise<void> {
        const channelIds = await this.serverlessWebsocketStore.getAllChannelIds()
        await this.sendMessages(channelIds, channelId, data)
    }

    async publish(topic: string, fromChannelId: string, data: Out, isBinary?: boolean): Promise<void> {
        const channelIds = await this.serverlessWebsocketStore.getChannelIdsForTopic(topic)
        await this.sendMessages(channelIds, fromChannelId, data)
    }

    async onChannelClosed(channelId: string): Promise<void> {
        // This is dealt with by the ServerlessWebsocketStore
    }

    private async sendMessages(channelIds: string[], fromChannelId: string, data: Out, isBinary?: boolean): Promise<void> {
        if (isBinary) {
            throw new Error("Binary data is not supported on serverless lambdas")
        }

        const Data = JSON.stringify(data)
        const callbackAPI = new ApiGatewayManagementApiClient({
            apiVersion: '2018-11-29',
            endpoint: 'https://' + this.domainName + '/' + this.stage,
        });

        const sendMessages = channelIds.map(async (channelId) => {
            if (channelId !== fromChannelId) {
                try {
                    await callbackAPI.send(new PostToConnectionCommand(
                        { ConnectionId: channelId, Data }
                    ));
                } catch (e) {
                    console.log(e);
                }
            }
        });

        try {
            await Promise.all(sendMessages)
        } catch (e) {
            console.log(e);
        }
    }
}
