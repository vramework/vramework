/**
 * Interface defining the methods of a EventHub Service.
 */
export interface EventHubForwarder {
  /**
   * Sends data to all connections subscribed to a topic.
   * @param topic - The topic to send data to.
   * @param data - The data to send to the subscribers.
   */
  forwardPublish(
    topic: string,
    channelId: string,
    data: unknown,
    isBinary?: boolean
  ): Promise<void>

  /**
   * Sends data to all connections subscribed to a topic.
   * @param topic - The topic to send data to.
   * @param data - The data to send to the subscribers.
   */
  onForwardedPublishMessage(
    callback: (topic: string, data: unknown, isBinary?: boolean) => void
  ): void
}
