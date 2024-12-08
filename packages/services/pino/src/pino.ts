import pinoImp from 'pino'
const pino = 'default' in pinoImp ? pinoImp.default : (pinoImp as any)

import { Logger, LogLevel } from '@vramework/core/services'

export class PinoLogger implements Logger {
  public pino: pinoImp.Logger

  constructor() {
    this.pino = pino()
  }

  setLevel(level: LogLevel): void {
    // Using any here since we know they map
    this.pino.level = LogLevel[level]
  }

  info(messageOrObj: string | Record<string, any> | Error): void {
    this.pino.info(messageOrObj)
  }

  warn(messageOrObj: string | Record<string, any> | Error): void {
    this.pino.warn(messageOrObj)
  }

  error(messageOrObj: string | Record<string, any> | Error): void {
    this.pino.error(messageOrObj)
  }

  debug(messageOrObj: string | Record<string, any>): void {
    this.pino.debug(messageOrObj)
  }
}
