
export class VrameworkStream {
    private onMessageCallbacks = new Set<(data: any) => void>()
    private onOpenCallbacks = new Set<() => void>()
    private onCloseCallbacks = new Set<() => void>()
    private sendCallback?: (message: any) => void 

    constructor() {
    }

    onOpen(callback: () => Promise<void>): void {
        this.onOpenCallbacks.add(callback)
    }

    open () {
        this.onOpenCallbacks.forEach(callback => callback())
    }

    onMessage(callback: (data: any) => void): void {
        this.onMessageCallbacks.add(callback)
    }

    message (data: any) {
        this.onMessageCallbacks.forEach(callback => callback(data))
    }

    onClose(callback: () => Promise<void>): void {
        this.onCloseCallbacks.add(callback)
    }

    close () {
        this.onCloseCallbacks.forEach(callback => callback())
    }

    onSend (send: (message: any) => void) {
        this.sendCallback = send
    }

    send(message: any): void {
        if (this.sendCallback) {
            this.sendCallback(message)
        }
    }
}
