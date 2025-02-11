import { CoreUserSession } from '../types/core.types.js'
import { PikkuChannel, PikkuChannelHandler } from './channel.types.js'

export abstract class PikkuAbstractChannelHandler<
  UserSession extends CoreUserSession = CoreUserSession,
  OpeningData = unknown,
  Out = unknown,
> implements PikkuChannelHandler<UserSession, OpeningData, Out>
{
  protected channel?: PikkuChannel<UserSession, OpeningData, Out>

  constructor(
    public channelId: string,
    public channelName: string,
    protected userSession: UserSession | undefined,
    protected openingData: OpeningData
  ) {}

  public abstract setUserSession(userSession: UserSession): Promise<void> | void
  public abstract send(message: Out, isBinary?: boolean): Promise<void> | void

  public getChannel(): PikkuChannel<UserSession, OpeningData, Out> {
    if (!this.channel) {
      this.channel = {
        channelId: this.channelId,
        userSession: this.userSession,
        openingData: this.openingData,
        setUserSession: this.setUserSession.bind(this),
        send: this.send.bind(this),
        close: this.close.bind(this),
        state: 'initial',
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
