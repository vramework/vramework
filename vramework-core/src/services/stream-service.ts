import EventEmitter from "eventemitter3";

type Client = {
    write: (text: string) => void
}

export class StreamService extends EventEmitter {
    private clients = new Map<Client, string>()
    private topicMessages = new Map<string, Array<any>>()

    constructor () {
        super()
    }

    public addClient (client: Client, topic: string) {
        const messages = this.topicMessages.get(topic)
        if (messages) {
            for (const message of messages) {
                client.write(`data: ${JSON.stringify(message)}\n\n`)
            }
        } else {
            this.topicMessages.set(topic, [])
        }

        this.clients.set(client, topic)
    }

    public removeClient (client: Client) {
        const topic = this.clients.get(client)
        this.clients.delete(client)
        
        const values = [...this.clients.values()]
        if (!values.some(v => v === topic)) {
            this.emit('remove', topic)
        }
    }

    public sendUpdate (topic: string, data: any) {        
        const messages = this.topicMessages.get(topic)
        messages?.push(data)

        const entries = [...this.clients.entries()]
        const clients = entries.filter(([, clientTopic]) => topic === clientTopic)
        
        for (const [client] of clients) {
            client.write(`data: ${JSON.stringify(data)}\n\n`)
        }
    }
}