export enum LogLevel {
  'trace', // Add this level
  'debug',
  'info',
  'warn',
  'error',
  'critical',
}

/**
 * Interface for logging messages at various levels.
 */
export interface Logger {
  /**
   * Logs an informational message.
   * @param messageOrObj - The message or object to log.
   * @param meta - Additional metadata to log.
   * @description This method logs an informational message or object, along with any additional metadata.
   */
  info(messageOrObj: string | Record<string, any>, ...meta: any[]): void

  /**
   * Logs a warning message.
   * @param messageOrObj - The message or object to log.
   * @param meta - Additional metadata to log.
   * @description This method logs a warning message or object, along with any additional metadata.
   */
  warn(messageOrObj: string | Record<string, any>, ...meta: any[]): void

  /**
   * Logs an error message.
   * @param messageOrObj - The message, object, or error to log.
   * @param meta - Additional metadata to log.
   * @description This method logs an error message, object, or error, along with any additional metadata.
   */
  error(
    messageOrObj: string | Record<string, any> | Error,
    ...meta: any[]
  ): void

  /**
   * Logs a debug message.
   * @param message - The message to log.
   * @param meta - Additional metadata to log.
   * @description This method logs a debug message, along with any additional metadata.
   */
  debug(message: string, ...meta: any[]): void

  /**
   * Logs a trace message.
   * @param message - The message to log.
   * @param meta - Additional metadata to log.
   * @description This optional method logs a trace message, along with any additional metadata.
   */
  trace?(message: string, ...meta: any[]): void

  /**
   * Sets the logging level.
   * @param level - The logging level to set.
   * @description This method sets the logging level for the logger.
   */
  setLevel(level: LogLevel): void
}
