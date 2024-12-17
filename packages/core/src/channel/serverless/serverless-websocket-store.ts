import { CoreUserSession } from "../../types/core.types.js";
import { CoreAPIChannel } from "../channel.types.js";
import { SubscriptionService } from "../subscription-service.js";

export abstract class ServerlessWebsocketStore<OpeningData = unknown, Session extends CoreUserSession = CoreUserSession> {
    public abstract getSubscriptionService<Out = unknown>(): SubscriptionService<Out>
    public abstract addChannel(channelId: string, channelRoute: string): Promise<void>
    public abstract removeChannel(channelId: string): Promise<void>
    public abstract setSession(channelId: string, session: any): Promise<void>
    public abstract setLastInteraction(channelId: string, lastPing: number): Promise<void>
    public abstract getData(channelId: string): Promise<{ openingData: OpeningData, session: Session, channelConfig: CoreAPIChannel<OpeningData, any> }>
    public abstract getAllChannelIds(): Promise<string[]>
    public abstract getChannelIdsForTopic(topic: string): Promise<string[]>
    public abstract subscribe(topic: string, channelId: string): Promise<boolean>
    public abstract unsubscribe(topic: string, channelId: string): Promise<boolean>
}