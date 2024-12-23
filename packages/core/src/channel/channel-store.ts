import { CoreUserSession } from "../types/core.types.js";

export type Channel<ChannelType = unknown, OpeningData = unknown, UserSession extends CoreUserSession = CoreUserSession> = {
    channelId: string, 
    channelName: string,
    channelObject?: ChannelType,
    openingData?: OpeningData, 
    userSession?: UserSession
}

export abstract class ChannelStore<ChannelType = unknown, OpeningData = unknown, UserSession extends CoreUserSession = CoreUserSession, TypedChannel = Channel<ChannelType, OpeningData, UserSession>> {
    public abstract addChannel(channel: Channel<ChannelType, OpeningData, UserSession>): Promise<void> | void
    public abstract removeChannels(channelId: string[]): Promise<void> | void
    public abstract setUserSession(channelId: string, userSession: any): Promise<void> | void
    public abstract getChannel(channelId: string): Promise<TypedChannel> | TypedChannel
}