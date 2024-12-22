import { CoreUserSession } from "../../types/core.types.js";

export type Channel<ChannelType, OpeningData = unknown, UserSession extends CoreUserSession = CoreUserSession> = {
    channelId: string, 
    channelName: string,
    channelObject?: ChannelType,
    openingData?: OpeningData, 
    userSession?: UserSession
}

export abstract class ServerlessChannelStore<ChannelType = unknown, OpeningData = unknown, UserSession extends CoreUserSession = CoreUserSession, TypedChannel = Channel<ChannelType, OpeningData, UserSession>> {
    public abstract addChannel(channel: Channel<ChannelType, OpeningData, UserSession>): Promise<void> | void
    public abstract removeChannels(channelId: string[]): Promise<void> | void
    public abstract setUserSession(channelId: string, userSession: any): Promise<void> | void
    public abstract setLastInteraction(channelId: string, lastPing: Date): Promise<void> | void
    public abstract getChannel(channelId: string): Promise<TypedChannel> | TypedChannel
    public abstract getAllChannelIds(): Promise<string[]> | string[]
    // public abstract getAllChannels(): Promise<TypedChannel[]> | TypedChannel[]
}