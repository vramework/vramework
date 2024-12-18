import { ApiGatewayManagementApiClient } from '@aws-sdk/client-apigatewaymanagementapi'
import { SubscriptionService } from "@vramework/core/channel";
import { ServerlessWebsocketStore } from "@vramework/core/channel/serverless";
import { sendMessages } from './send-messages.js';
import { Logger } from '@vramework/core/services';

export class VrameworkLambdaSubscriptionService<Out = unknown> implements SubscriptionService<Out> {
    constructor(private logger: Logger, private serverlessWebsocketStore: ServerlessWebsocketStore, private callbackAPI: ApiGatewayManagementApiClient) {
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
     await sendMessages(this.logger, this.callbackAPI, fromChannelId, channelIds, data, isBinary)   
    }
}
