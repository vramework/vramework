import { DurableObjectState, WebSocket } from "@cloudflare/workers-types";
import { SubscriptionService } from "@vramework/core/channel";

export class CloudflareSubscriptionService<Data = unknown>
    implements SubscriptionService<Data> {
    private subscriptions: Map<string, Set<string>> = new Map()
    private isDirty = false
    private state: 'initial' | 'loading' | 'ready' = 'initial'
    private loadedCallbacks: (() => void)[] = []

    constructor(private ctx: DurableObjectState) {
        // Ensure state is saved before hibernation
        ctx.blockConcurrencyWhile(async () => {
            if (this.isDirty) {
                await this.syncSubscriptions();
            }
        });
    }

    private async ensureSubscriptionsLoaded(): Promise<void> {
        if (this.state === 'initial') {
            this.state = 'loading'
            const storedSubscriptions = await this.ctx.storage.get<string>("subscriptions");
            if (storedSubscriptions) {
                const parsedSubscriptions = JSON.parse(storedSubscriptions);
                this.subscriptions = new Map(
                    Object.entries<string[]>(parsedSubscriptions).map(([topic, channelIds]) => [
                        topic,
                        new Set(channelIds),
                    ])
                );
            }
            this.state = 'ready';
        } else if (this.state === 'loading') {
            await new Promise<void>((resolve) => {
                this.loadedCallbacks.push(resolve);
            })
            this.loadedCallbacks = [];
        }
    }

    /**
     * Synchronize in-memory subscriptions with Durable Object storage.
     */
    private async syncSubscriptions(): Promise<void> {
        if (!this.isDirty) return
        const serializedSubscriptions = Object.fromEntries(
            Array.from(this.subscriptions.entries()).map(([topic, channelIds]) => [
                topic,
                Array.from(channelIds),
            ])
        );
        await this.ctx.storage.put("subscriptions", JSON.stringify(serializedSubscriptions))
        this.isDirty = false
    }

    /**
     * Subscribes a connection to a specific topic.
     */
    public async subscribe(topic: string, channelId: string): Promise<void> {
        await this.ensureSubscriptionsLoaded()

        if (!this.subscriptions.has(topic)) {
            this.subscriptions.set(topic, new Set());
        }
        this.subscriptions.get(topic)?.add(channelId);
        this.isDirty = true;
    }

    /**
     * Unsubscribes a connection from a specific topic.
     */
    public async unsubscribe(topic: string, channelId: string): Promise<void> {
        await this.ensureSubscriptionsLoaded()

        const channelIds = this.subscriptions.get(topic);
        if (channelIds) {
            channelIds.delete(channelId);
            if (channelIds.size === 0) {
                this.subscriptions.delete(topic);
            }
            this.isDirty = true;
        }
    }

    /**
     * Sends data to all connections subscribed to a specific topic.
     * @param topic - The topic to send data to.
     * @param data - The data to send to the subscribers.
     * @param isBinary - Indicates if the data is binary.
     */
    public async publish(topic: string, fromChannelId: string, data: Data, isBinary: boolean = false) {
        await this.ensureSubscriptionsLoaded()

        const channelIds = this.subscriptions.get(topic);
        if (!channelIds) {
            console.warn(`No subscribers for topic: ${topic}`);
            return;
        }
        for (const channelId of channelIds) {
            if (fromChannelId === channelId) {
                continue
            }
            try {
                const websocket = this.getWebsocket(channelId);
                websocket.send(JSON.stringify(data))
            } catch (error) {
                console.error(`Failed to send message to ${channelId} on topic ${topic}:`, error);
            }
        }
    }

    /**
     * Handles cleanup when a channel is closed.
     */
    public async onChannelClosed(channelId: string): Promise<void> {
        for (const [topic, channelIds] of this.subscriptions.entries()) {
            if (channelIds.delete(channelId)) {
                if (channelIds.size === 0) {
                    this.subscriptions.delete(topic);
                }
                this.isDirty = true;
            }
        }
    }

    /**
 * Retrieves the WebSocket associated with a channel ID.
 * @param channelId - The channel ID to get the WebSocket for.
 * @returns The WebSocket instance.
 */
    private getWebsocket(channelId: string): WebSocket {
        const [websocket] = this.ctx.getWebSockets(channelId);
        if (!websocket) {
            throw new Error(`WebSocket not found for channel ID: ${channelId}`);
        }
        return websocket;
    }
}
