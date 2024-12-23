import { CoreUserSession } from '../types/core.types.js'
import { VrameworkChannel, VrameworkChannelHandler } from './channel.types.js'

export abstract class VrameworkAbstractChannelHandler<
  UserSession extends CoreUserSession = CoreUserSession,
  OpeningData = unknown,
  Out = unknown,
> implements VrameworkChannelHandler<UserSession, OpeningData, Out> {
  protected channel?: VrameworkChannel<UserSession, OpeningData, Out>

  constructor(
    public channelId: string,
    public channelName: string,
    protected userSession: UserSession | undefined,
    protected openingData: OpeningData
  ) {
  }

  public abstract setUserSession(userSession: UserSession): Promise<void> | void
  public abstract send(message: Out, isBinary?: boolean): Promise<void> | void

  public getChannel(): VrameworkChannel<UserSession, OpeningData, Out> {
    if (!this.channel) {
      this.channel = {
        channelId: this.channelId,
        userSession: this.userSession,
        openingData: this.openingData,
        setUserSession: this.setUserSession.bind(this),
        send: this.send.bind(this),
        close: this.close.bind(this),
        state: 'initial'
      }
    }
    return this.channel
  }

  public open(): void {
    this.getChannel().state = 'open'
  }

  public close(): Promise<void> | void {
    this.getChannel().state = 'closed'
  }
}
