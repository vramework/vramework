import { DurableObjectState } from "@cloudflare/workers-types";
import { ServerlessChannelStore } from "@vramework/core/channel/serverless";
import { WebSocket } from '@cloudflare/workers-types'

export class CloudflareWebsocketStore extends ServerlessChannelStore {
    constructor (private ctx: DurableObjectState) {
        super()
    }

    public async addChannel(channelId: string, channelName: string, openingData: unknown, websocket: WebSocket): Promise<void> {
        // The channel id is added when we accept the websocket connection
        websocket.serializeAttachment({ name: channelName, openingData })
    }

    public async removeChannels(channelIds: string[]): Promise<void> {
        // This is done by the durable object itself
    }

    public async setSession(channelId: string, userSession: any): Promise<void> {
        const websocket = this.getWebsocket(channelId)
        const { openingData, name } = websocket.deserializeAttachment()
        console.log(websocket, openingData, name)
        websocket.serializeAttachment({
            openingData,
            name,
            userSession
        })
    }

    public async setLastInteraction(channelId: string, lastPing: Date): Promise<void> {
        // Not used either...
    }

    public async getData (channelId: string) {
        const websocket = this.getWebsocket(channelId)
        return websocket.deserializeAttachment()
    }

    public async getAllChannelIds(): Promise<string[]> {
        return this.ctx.getWebSockets().map((ws) => this.ctx.getTags(ws)[0]).filter(t => !!t) as string[]
    }

    private getWebsocket(channelId: string) {
        console.log('Getting websocket', channelId)
        const [websocket] = this.ctx.getWebSockets(channelId)
        if (!websocket) {
            throw new Error('Websocket not found')
        }
        return websocket
    }
}
