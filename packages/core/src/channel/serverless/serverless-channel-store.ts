import { CoreUserSession } from "../../types/core.types.js";

export abstract class ServerlessChannelStore<OpeningData = unknown, UserSession extends CoreUserSession = CoreUserSession> {
    public abstract addChannel(channelId: string, channelRoute: string, channel?: unknown): Promise<void>
    public abstract removeChannels(channelId: string[]): Promise<void>
    public abstract setSession(channelId: string, session: any): Promise<void>
    public abstract setLastInteraction(channelId: string, lastPing: Date): Promise<void>
    public abstract getData(channelId: string): Promise<{ openingData: OpeningData, userSession: UserSession, name: string }>
    public abstract getAllChannelIds(): Promise<string[]>
    public abstract getChannelIdsForTopic(topic: string): Promise<string[]>
    public abstract subscribe(topic: string, channelId: string): Promise<boolean>
    public abstract unsubscribe(topic: string, channelId: string): Promise<boolean>
}