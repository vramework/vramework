import {
  SubscriptionService,
  VrameworkChannelHandler,
} from '@vramework/core/channel'
import * as uWS from 'uWebSockets.js'

export class UWSSubscriptionService implements SubscriptionService<unknown> {
  public constructor(
    private sockets: Map<
      string,
      uWS.WebSocket<{ channelHandler: VrameworkChannelHandler }>
    >
  ) {}

  public async subscribe(topic: string, connectionId: string): Promise<void> {
    const socket = this.sockets.get(connectionId)
    socket?.subscribe(topic)
  }

  public async unsubscribe(topic: string, connectionId: string): Promise<void> {
    const socket = this.sockets.get(connectionId)
    socket?.unsubscribe(topic)
  }

  public async broadcast(
    topic: string,
    connectionId: string,
    message: any,
    isBinary?: boolean
  ): Promise<void> {
    const socket = this.sockets.get(connectionId)
    socket?.publish(topic, JSON.stringify(message), isBinary)
  }

  public async onChannelClosed(channelId: string): Promise<void> {
    // This is dealt with by uws directly
  }
}
