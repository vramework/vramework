import { ApiGatewayManagementApiClient } from '@aws-sdk/client-apigatewaymanagementapi'
import { SubscriptionService } from "@vramework/core/channel";
import { ServerlessChannelStore, ServerlessSubscriptionStore } from "@vramework/core/channel/serverless";
import { sendMessages } from './utils.js';
import { Logger } from '@vramework/core/services';

export class LambdaSubscriptionService<Out = unknown> implements SubscriptionService<Out> {
    constructor(private logger: Logger, private channelStore: ServerlessChannelStore, private subscriptionStore: ServerlessSubscriptionStore, private callbackAPI: ApiGatewayManagementApiClient) {
    }

    async subscribe(topic: string, channelId: string): Promise<void> {
        await this.subscriptionStore.subscribe(topic, channelId)
    }

    async unsubscribe(topic: string, channelId: string): Promise<void> {
        await this.subscriptionStore.unsubscribe(topic, channelId)
    }

    async publish(topic: string, fromChannelId: string, data: Out, isBinary?: boolean): Promise<void> {
        const channelIds = await this.subscriptionStore.getChannelIdsForTopic(topic)
        await this.sendMessages(channelIds, fromChannelId, data)
    }

    private async sendMessages(channelIds: string[], fromChannelId: string, data: Out, isBinary?: boolean): Promise<void> {
        await sendMessages(this.logger, this.channelStore, this.callbackAPI, fromChannelId, channelIds, data, isBinary)
    }
}
