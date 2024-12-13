/**
 * Interface defining the methods of a Subscription Service.
 */
export interface SubscriptionServiceForwarder {
  /**
   * Sends data to all connections subscribed to a topic.
   * @param topic - The topic to send data to.
   * @param data - The data to send to the subscribers.
   */
  forward (
    topic: string,
    connectionId: string,
    data: unknown,
    isBinary?: boolean
  ): Promise<void>

  /**
   * Sends data to all connections subscribed to a topic.
   * @param topic - The topic to send data to.
   * @param data - The data to send to the subscribers.
   */
  onForwardedMessage (
    callback: (topic: string, data: unknown, isBinary?: boolean) => void
  ): void
}
