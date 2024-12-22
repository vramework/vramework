import { CoreUserSession } from "../../types/core.types.js";

export abstract class ServerlessChannelStore<ChannelType = unknown, OpeningData = unknown, UserSession extends CoreUserSession = CoreUserSession> {
    public abstract addChannel(channelId: string, channelRoute: string, openingData: OpeningData | null, channel: ChannelType | null): Promise<void> | void
    public abstract removeChannels(channelId: string[]): Promise<void> | void
    public abstract setSession(channelId: string, session: any): Promise<void> | void
    public abstract setLastInteraction(channelId: string, lastPing: Date): Promise<void> | void
    public abstract getData(channelId: string): Promise<{ openingData: OpeningData, userSession: UserSession, name: string }> | { openingData: OpeningData, userSession: UserSession, name: string }
    public abstract getAllChannelIds(): Promise<string[]> | string[]
}