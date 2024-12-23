import { CoreSingletonServices, CoreServices, CoreUserSession, CreateSessionServices, MakeRequired } from "@vramework/core"
import { ChannelStore } from "@vramework/core/channel"

export type WebsocketParams<SingletonServices extends CoreSingletonServices, Services extends CoreServices<SingletonServices>, UserSession extends CoreUserSession> = {
    channelStore: ChannelStore,
    singletonServices: MakeRequired<SingletonServices, 'eventHub'>,
    createSessionServices?: CreateSessionServices<
      SingletonServices,
      Services,
      UserSession
    >
}