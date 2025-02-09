import { CreateConfig } from '@pikku/core'
import { LogLevel } from '@pikku/core/services'
import { Config } from '../../functions/types/application-types.js'

export const getConfig: CreateConfig<Config> = async () => ({
  port: 4002,
  hostname: '127.0.0.1',
  logLevel: LogLevel.debug,
})
