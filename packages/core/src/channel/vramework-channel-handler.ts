import { CoreUserSession } from "../types/core.types.js"

export interface VrameworkChannel<Session, OpeningData, In, Out> {
  session?: Session
  setSession: (session: Session) => void
  openingData: OpeningData
  send: (data: Out) => void
  data: In
  close: () => void
}

export class VrameworkChannelHandler<
  UserSession extends CoreUserSession = CoreUserSession,
  OpeningData = unknown,
  Out = unknown,
> {
  private userSession?: UserSession
  private onMessageCallback?: (message: unknown) => void
  private openCallBack?: () => void
  private closeCallback?: () => void
  private sendCallback?: (message: Out) => void
  private channel?: { session: UserSession; openingData: OpeningData; setSession: (session: UserSession) => void; send: (message: Out) => void; close: () => void; data: undefined }

  constructor(private openingData: OpeningData, private updateSession: (session: UserSession) => void) { }

  public getChannelWithData<In>(data: In): VrameworkChannel<UserSession, OpeningData, In, Out> {
    const channel = this.getChannel()
    return { ...channel, data }
  }

  public getChannel(): VrameworkChannel<UserSession, OpeningData, undefined, Out> {
    if (!this.channel) {
      this.channel = {
        session: this.userSession!,
        openingData: this.openingData,
        setSession: this.setSession.bind(this),
        send: this.send.bind(this),
        close: this.close.bind(this),
        data: undefined,
      }
    }
    return this.channel
  }

  public registerOnOpen(callback: () => Promise<void>): void {
    this.openCallBack = callback
  }

  public open() {
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
    this.closeCallback?.()
  }

  public registerOnSend(send: (message: Out) => void) {
    this.sendCallback = send
  }

  public send(message: Out): void {
    if (!this.sendCallback) {
      throw new Error('No send callback registered')
    }
    return this.sendCallback?.(message)
  }

  public setSession(session: UserSession): void {
    return this.updateSession(session)
  }
}
