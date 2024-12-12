import { CoreUserSession } from '../types/core.types.js'
import { SubscriptionService } from './subscription-service.js'

export interface VrameworkChannel<Session, OpeningData, Out> {
  // The channel identifier
  channelId: string
  // The user session, if available
  session?: Session
  // Update the user session, useful if you deal with auth on the
  // stream side
  setSession: (session: Session) => void
  // The data the channel was created with. This could be query parameters
  // or parameters in the url.
  openingData: OpeningData
  // The data to send. This will fail is the stream has been closed.
  send: (data: Out, isBinary?: boolean) => void
  // Broadcast data to all channels, or a subset of selected ones
  broadcast: (data: Out) => void
  // This will close the channel.
  close: () => void
  // The current state of the channel
  state: 'initial' | 'open' | 'closed'
  // subscription service
  subscriptions: SubscriptionService<Out>
}

export class VrameworkChannelHandler<
  UserSession extends CoreUserSession = CoreUserSession,
  OpeningData = unknown,
  Out = unknown,
> {
  userSession?: UserSession
  private onMessageCallback?: (message: unknown) => void
  private openCallBack?: () => void
  private closeCallback?: () => void
  private sendCallback?: (message: Out) => void
  private channel?: VrameworkChannel<UserSession, OpeningData, Out>

  constructor(
    public channelId: string,
    private openingData: OpeningData,
    private subscriptionService: SubscriptionService<Out>,
    private broadcast: (fromChannelId: string, data: Out) => void
  ) {}

  public getChannel(): VrameworkChannel<UserSession, OpeningData, Out> {
    if (!this.channel) {
      this.channel = {
        channelId: this.channelId,
        session: this.userSession!,
        openingData: this.openingData,
        setSession: this.setSession.bind(this),
        send: this.send.bind(this),
        close: this.close.bind(this),
        state: 'initial',
        broadcast: (data: Out) => {
          this.broadcast(this.channelId, data)
        },
        subscriptions: this.subscriptionService,
      }
    }
    return this.channel
  }

  public registerOnOpen(callback: () => Promise<void>): void {
    this.openCallBack = callback
  }

  public open() {
    this.getChannel().state = 'open'
    if (this.openCallBack) {
      this.openCallBack()
    }
  }

  public registerOnMessage(callback: (data: any) => void): void {
    this.onMessageCallback = callback
  }

  public message(data: unknown) {
    this.onMessageCallback?.(data)
  }

  public registerOnClose(callback: () => Promise<void>): void {
    this.closeCallback = callback
  }

  public close() {
    this.getChannel().state = 'closed'
    this.closeCallback?.()
  }

  public registerOnSend(send: (message: Out) => void) {
    this.sendCallback = send
  }

  public send(message: Out, isBinary?: boolean): void {
    if (!this.sendCallback) {
      throw new Error('No send callback registered')
    }
    return this.sendCallback?.(message)
  }

  public setSession(session: UserSession): void {
    this.getChannel().session = session
  }
}
