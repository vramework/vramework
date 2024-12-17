import { CoreUserSession } from "../../types/core.types.js"
import { VrameworkChannelHandler } from "../vramework-channel-handler.js"

export class VrameworkLocalChannelHandler<
  UserSession extends CoreUserSession = CoreUserSession,
  OpeningData = unknown,
  Out = unknown,
> extends VrameworkChannelHandler<UserSession, OpeningData, Out> {
  private onMessageCallback?: (message: unknown) => void
  private openCallBack?: () => void
  private closeCallback?: () => void
  private sendCallback?: (message: Out, isBinary?: boolean) => void

  public registerOnOpen(callback: () => Promise<void>): void {
    this.openCallBack = callback
  }

  public open() {
    this.getChannel().state = 'open'
    if (this.openCallBack) {
      this.openCallBack()
    }
  }

  public registerOnMessage(callback: (data: any) => void): void {
    this.onMessageCallback = callback
  }

  public message(data: unknown) {
    this.onMessageCallback?.(data)
  }

  public registerOnClose(callback: () => Promise<void>): void {
    this.closeCallback = callback
  }

  public close() {
    super.close()
    this.closeCallback?.()
  }

  public registerOnSend(send: (message: Out) => void) {
    this.sendCallback = send
  }

  public async send(message: Out, isBinary?: boolean): Promise<void> {
    if (!this.sendCallback) {
      throw new Error('No send callback registered')
    }
    return this.sendCallback?.(message, isBinary)
  }

  public async setSession(session: UserSession): Promise<void> {
    this.getChannel().session = session
  }
}
