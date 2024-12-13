import {
  SubscriptionService,
  SubscriptionServiceForwarder
} from '@vramework/core/channel'
import * as uWS from 'uWebSockets.js'

export class UWSSubscriptionService implements SubscriptionService<unknown> {
  private sockets: Map<
    string,
    uWS.WebSocket<unknown>
  > = new Map()

  constructor (uws?: uWS.TemplatedApp, private forwarder?: SubscriptionServiceForwarder) {
    if (uws) {
      forwarder?.onForwardedMessage(this.forwardMessage.bind(this, uws))
    }
  }

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
    if (socket) {
      this.forwardMessage(socket, topic, message, isBinary)
    }
    this.forwarder?.forward(topic, message, isBinary)
  }

  public async onChannelOpened(channelId: string, socket: uWS.WebSocket<unknown>): Promise<void> {
    this.sockets.set(channelId, socket)
  }

  public async onChannelClosed(channelId: string): Promise<void> {
    this.sockets.delete(channelId)
  }

  private forwardMessage(broadcaster: uWS.TemplatedApp | uWS.WebSocket<unknown>, topic: string, message: any, isBinary?: boolean): void {
    if (isBinary) {
      broadcaster?.publish(topic, message, true)
    } else {
      broadcaster?.publish(topic, JSON.stringify(message), true)
    }
  }
}
