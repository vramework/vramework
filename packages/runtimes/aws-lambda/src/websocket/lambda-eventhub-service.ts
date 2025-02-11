import { ApiGatewayManagementApiClient } from '@aws-sdk/client-apigatewaymanagementapi'
import {
  ChannelStore,
  EventHubService,
  EventHubStore,
} from '@pikku/core/channel'
import { getApiGatewayManagementApiClient, sendMessages } from './utils.js'
import { Logger } from '@pikku/core/services'
import { APIGatewayEvent } from 'aws-lambda'

export class LambdaEventHubService<Out = unknown>
  implements EventHubService<Out>
{
  private callbackAPI: ApiGatewayManagementApiClient

  constructor(
    private logger: Logger,
    event: APIGatewayEvent,
    private channelStore: ChannelStore,
    private eventHubStore: EventHubStore
  ) {
    this.callbackAPI = getApiGatewayManagementApiClient(logger, event)
  }

  async subscribe(topic: string, channelId: string): Promise<void> {
    await this.eventHubStore.subscribe(topic, channelId)
  }

  async unsubscribe(topic: string, channelId: string): Promise<void> {
    await this.eventHubStore.unsubscribe(topic, channelId)
  }

  async publish(
    topic: string,
    fromChannelId: string,
    data: Out,
    isBinary?: boolean
  ): Promise<void> {
    const channelIds = await this.eventHubStore.getChannelIdsForTopic(topic)
    await this.sendMessages(channelIds, fromChannelId, data)
  }

  private async sendMessages(
    channelIds: string[],
    fromChannelId: string,
    data: Out,
    isBinary?: boolean
  ): Promise<void> {
    await sendMessages(
      this.logger,
      this.channelStore,
      this.callbackAPI,
      fromChannelId,
      channelIds,
      data,
      isBinary
    )
  }
}
