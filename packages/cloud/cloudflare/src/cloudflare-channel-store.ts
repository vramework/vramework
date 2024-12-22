import { DurableObjectState, WebSocket } from "@cloudflare/workers-types";
import { Channel, ServerlessChannelStore } from "@vramework/core/channel/serverless";

export class CloudflareWebsocketStore extends ServerlessChannelStore {
    constructor (private ctx: DurableObjectState) {
        super()
    }

    public async addChannel({
        channelName,
        channelObject,
        openingData
    }: Channel<WebSocket>): Promise<void> {
        if (!channelObject) {
            throw new Error('Channel object is required for cloudflare')
        }
        // The channel id is added when we accept the websocket connection
        channelObject?.serializeAttachment({ channelName, openingData })
    }

    public async removeChannels(channelIds: string[]): Promise<void> {
        // This is done by the durable object itself
    }

    public async setUserSession(channelId: string, userSession: any): Promise<void> {
        const websocket = this.getWebsocket(channelId)
        const { openingData, channelName } = websocket.deserializeAttachment()
        websocket.serializeAttachment({
            openingData,
            channelName,
            userSession
        })
    }

    public async setLastInteraction(channelId: string, lastPing: Date): Promise<void> {
        // Not used either...
    }

    public async getChannel (channelId: string) {
        const websocket = this.getWebsocket(channelId)
        return websocket.deserializeAttachment()
    }

    public async getAllChannelIds(): Promise<string[]> {
        return this.ctx.getWebSockets().map((ws) => this.ctx.getTags(ws)[0]).filter(t => !!t) as string[]
    }

    private getWebsocket(channelId: string) {
        const [websocket] = this.ctx.getWebSockets(channelId)
        if (!websocket) {
            throw new Error('Websocket not found')
        }
        return websocket
    }
}
