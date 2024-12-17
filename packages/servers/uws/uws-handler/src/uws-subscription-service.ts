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

  constructor(uws?: uWS.TemplatedApp, private forwarder?: SubscriptionServiceForwarder) {
    if (uws) {
      forwarder?.onForwardedPublishMessage(this.forwardPublishMessage.bind(this, uws))
      forwarder?.onForwardedBroadcastMessage(this.forwardBroadcastMessage.bind(this, undefined))
    }
  }

  public async subscribe(topic: string, channelId: string): Promise<void> {
    const socket = this.sockets.get(channelId)
    socket?.subscribe(topic)
  }

  public async unsubscribe(topic: string, channelId: string): Promise<void> {
    const socket = this.sockets.get(channelId)
    socket?.unsubscribe(topic)
  }

  public async broadcast(channelId: string, message: any, isBinary?: boolean) {
    const data = isBinary ? message : JSON.stringify(message)
    for (const [toChannelId, socket] of this.sockets) {
      if (toChannelId !== channelId) {
        socket.send(data, isBinary)
      }
    }
    this.forwarder?.forwardBroadcast(message, isBinary)
  }

  public async publish(
    topic: string,
    channelId: string,
    message: any,
    isBinary?: boolean
  ): Promise<void> {
    const socket = this.sockets.get(channelId)
    if (socket) {
      this.forwardPublishMessage(socket, topic, message, isBinary)
    }
    this.forwarder?.forwardPublish(topic, message, isBinary)
  }

  public async onChannelOpened(channelId: string, socket: uWS.WebSocket<unknown>): Promise<void> {
    this.sockets.set(channelId, socket)
  }

  public async onChannelClosed(channelId: string): Promise<void> {
    this.sockets.delete(channelId)
  }

  private forwardPublishMessage(broadcaster: uWS.TemplatedApp | uWS.WebSocket<unknown>, topic: string, message: any, isBinary?: boolean): void {
    if (isBinary) {
      broadcaster?.publish(topic, message, true)
    } else {
      broadcaster?.publish(topic, JSON.stringify(message), false)
    }
  }

  private forwardBroadcastMessage(channelId: string | undefined, message: any, isBinary?: boolean): void {
    const data = isBinary ? message : JSON.stringify(message)
    for (const [toChannelId, socket] of this.sockets) {
      if (toChannelId !== channelId) {
        socket.send(data, isBinary)
      }
    }
  }
}
