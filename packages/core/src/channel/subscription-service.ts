/**
 * Interface defining the methods of a Subscription Service.
 */
export interface SubscriptionService<Out> {
  /**
   * Subscribes a connection to a specific topic.
   * @param topic - The topic to subscribe to.
   * @param connectionId - The unique ID of the connection to subscribe.
   */
  subscribe(topic: string, connectionId: string): Promise<void>

  /**
   * Unsubscribes a connection from a specific topic.
   * @param topic - The topic to unsubscribe from.
   * @param connectionId - The unique ID of the connection to unsubscribe.
   */
  unsubscribe(topic: string, connectionId: string): Promise<void>

  /**
   * Sends data to all connections subscribed to a topic.
   * @param topic - The topic to send data to.
   * @param data - The data to send to the subscribers.
   */
  broadcast(
    topic: string,
    connectionId: string,
    data: Out,
    isBinary?: boolean
  ): Promise<void>

  /**
   * Handles cleanup when a channel is closed.
   * @param channelId - The ID of the channel that was closed.
   */
  onChannelClosed(channelId: string): Promise<void>
}
