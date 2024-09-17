export enum LogLevel {
  'trace', // Add this level
  'debug',
  'info',
  'warn',
  'error',
  'critical',
}

export interface Logger {
  info(messageOrObj: string | Record<string, any>, ...meta: any[]): void
  warn(messageOrObj: string | Record<string, any>, ...meta: any[]): void
  error(
    messageOrObj: string | Record<string, any> | Error,
    ...meta: any[]
  ): void
  debug(message: string, ...meta: any[]): void
  trace?(message: string, ...meta: any[]): void // Optional trace method
  setLevel(level: LogLevel): void
}

export class ConsoleLogger implements Logger {
  private level: LogLevel = LogLevel.info

  setLevel(level: LogLevel): void {
    this.level = level
  }

  trace?(message: string, ...meta: any[]): void {
    if (this.level <= LogLevel.trace) {
      console.trace('TRACE:', message, ...meta)
    }
  }

  debug(message: string, ...meta: any[]): void {
    if (this.level <= LogLevel.debug) {
      console.debug('DEBUG:', message, ...meta)
    }
  }

  info(messageOrObj: string | Record<string, any>, ...meta: any[]): void {
    if (this.level <= LogLevel.info) {
      console.log('INFO:', messageOrObj, ...meta)
    }
  }

  warn(messageOrObj: string | Record<string, any>, ...meta: any[]): void {
    if (this.level <= LogLevel.warn) {
      console.warn('WARN:', messageOrObj, ...meta)
    }
  }

  error(
    messageOrObj: string | Record<string, any> | Error,
    ...meta: any[]
  ): void {
    if (this.level <= LogLevel.error) {
      console.error(
        'ERROR:',
        messageOrObj instanceof Error ? messageOrObj.message : messageOrObj,
        ...meta
      )
      if (messageOrObj instanceof Error) {
        console.error('STACK:', messageOrObj.stack)
      }
    }
  }

  log(level: string, message: string, ...meta: any[]): void {
    const logLevel = LogLevel[level as keyof typeof LogLevel]
    if (logLevel >= this.level) {
      console.log(level.toUpperCase() + ':', message, ...meta)
    }
  }
}
