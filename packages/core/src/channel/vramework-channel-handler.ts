import { CoreUserSession } from '../types/core.types.js'
import { VrameworkChannel } from './channel.types.js'
import { SubscriptionService } from './subscription-service.js'

export abstract class VrameworkChannelHandler<
  UserSession extends CoreUserSession = CoreUserSession,
  OpeningData = unknown,
  Out = unknown,
> {
  protected userSession?: UserSession
  protected channel?: VrameworkChannel<UserSession, OpeningData, Out>

  constructor(
    public channelId: string,
    protected openingData: OpeningData,
    protected subscriptionService: SubscriptionService<Out>
  ) {}
  public abstract setSession(session: UserSession): Promise<void>
  public abstract send(message: Out, isBinary?: boolean): Promise<void>


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
          this.subscriptionService.broadcast(this.channelId, data)
        },
        subscriptions: this.subscriptionService,
      }
    }
    return this.channel
  }

  public open() {
    this.getChannel().state = 'open'
  }

  public close() {
    this.getChannel().state = 'closed'
  }
}
