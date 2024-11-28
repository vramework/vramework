export class VrameworkStream<OpeningData = unknown, In = unknown, Out = unknown> {
  private onMessageCallback?: (message: any) => void
  private openCallBack?: () => void
  private closeCallback?: () => void
  private sendCallback?: (message: any) => void

  constructor(private openingData: OpeningData) {}

  public getOpeningData(): OpeningData {
    return this.openingData
  }

  registerOnOpen(callback: () => Promise<void>): void {
    this.openCallBack = callback
  }

  open() {
    if (this.openCallBack) {
      this.openCallBack()
    }
  }

  registerOnMessage(callback: (data: any) => void): void {
    this.onMessageCallback = callback
  }

  message(data: any) {
    this.onMessageCallback?.(data)
  }

  registerOnClose(callback: () => Promise<void>): void {
    this.closeCallback = callback
  }

  close() {
    this.closeCallback?.()
  }

  registerOnSend(send: (message: any) => void) {
    this.sendCallback = send
  }

  send(message: any): void {
    this.sendCallback?.(message)
  }
}
