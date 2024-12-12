import { getOpenChannels } from './channel-runner.js'
import { SubscriptionService } from './subscription-service.js'

/**
 * Implementation of the SubscriptionService interface.
 * Manages subscriptions and broadcasts messages to subscribers.
 */
export class LocalSubscriptionService<Data = unknown>
  implements SubscriptionService<Data>
{
  /**
   * A map storing topics and their associated connection IDs.
   */
  private subscriptions: Map<string, Set<string>> = new Map()

  /**
   * Subscribes a connection to a specific topic.
   * Creates the topic if it does not already exist.
   * @param topic - The topic to subscribe to.
   * @param connectionId - The unique ID of the connection to subscribe.
   */
  public async subscribe(topic: string, connectionId: string): Promise<void> {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set())
    }
    this.subscriptions.get(topic)!.add(connectionId)
  }

  /**
   * Unsubscribes a connection from a specific topic.
   * Removes the topic if it has no more subscribers.
   * @param topic - The topic to unsubscribe from.
   * @param connectionId - The unique ID of the connection to unsubscribe.
   */
  public async unsubscribe(topic: string, connectionId: string): Promise<void> {
    const topicSubscriptions = this.subscriptions.get(topic)
    if (topicSubscriptions) {
      topicSubscriptions.delete(connectionId)
      if (topicSubscriptions.size === 0) {
        this.subscriptions.delete(topic) // Cleanup empty subscriptions
      }
    }
  }

  /**
   * Sends data to all connections subscribed to a topic.
   * @param topic - The topic to send data to.
   * @param data - The data to send to the subscribers.
   */
  public async broadcast(
    topic: string,
    connectionId: string,
    data: Data,
    isBinary?: boolean
  ): Promise<void> {
    const openChannels = getOpenChannels()
    const subscribedChannelIds = this.subscriptions.get(topic)
    if (!subscribedChannelIds) return

    for (const channelId of subscribedChannelIds) {
      if (channelId === connectionId) continue // Skip sending to the sender
      const channel = openChannels.get(channelId)
      channel?.send(data, isBinary)
    }
  }

  /**
   * Handles cleanup when a channel is closed.
   * Removes the channel from all topics it is subscribed to.
   * Deletes the topic if no more channels are subscribed to it.
   * @param channelId - The ID of the channel that was closed.
   */
  public async onChannelClosed(channelId: string): Promise<void> {
    for (const [topic, channelIds] of this.subscriptions.entries()) {
      channelIds.delete(channelId)
      if (channelIds.size === 0) {
        this.subscriptions.delete(topic) // Cleanup empty topics
      }
    }
  }
}
