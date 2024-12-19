import { ApiGatewayManagementApiClient } from '@aws-sdk/client-apigatewaymanagementapi'
import { SubscriptionService } from "@vramework/core/channel";
import { ServerlessChannelStore } from "@vramework/core/channel/serverless";
import { sendMessages } from './utils.js';
import { Logger } from '@vramework/core/services';

export class VrameworkLambdaSubscriptionService<Out = unknown> implements SubscriptionService<Out> {
    constructor(private logger: Logger, private channelStore: ServerlessChannelStore, private callbackAPI: ApiGatewayManagementApiClient) {
    }

    async subscribe(topic: string, channelId: string): Promise<void> {
        await this.channelStore.subscribe(topic, channelId)
    }

    async unsubscribe(topic: string, channelId: string): Promise<void> {
        await this.channelStore.unsubscribe(topic, channelId)
    }

    async broadcast(channelId: string, data: Out, isBinary?: boolean): Promise<void> {
        const channelIds = await this.channelStore.getAllChannelIds()
        await this.sendMessages(channelIds, channelId, data)
    }

    async publish(topic: string, fromChannelId: string, data: Out, isBinary?: boolean): Promise<void> {
        const channelIds = await this.channelStore.getChannelIdsForTopic(topic)
        await this.sendMessages(channelIds, fromChannelId, data)
    }

    private async sendMessages(channelIds: string[], fromChannelId: string, data: Out, isBinary?: boolean): Promise<void> {
        await sendMessages(this.logger, this.channelStore, this.callbackAPI, fromChannelId, channelIds, data, isBinary)
    }
}
