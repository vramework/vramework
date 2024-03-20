import pino from "pino"

import { Config, Services, SingletonServices, UserSession } from './api'
import { JWTService } from '@vramework/core/dist/services/jwt-service'
import { LocalContent } from '@vramework/core/dist/services/local-content'
import { VrameworkSessionService } from '@vramework/core/dist/services/vramework-session-service'
import { CoreUserSession } from '@vramework/core/dist/user-session'
import { LocalSecretService } from "@vramework/core/dist/services/local-secrets"

import '@vramework-example/functions/generated/schemas'
import { KyselyDatabase } from "./services/database"

export const setupServices = async (config: Config): Promise<SingletonServices> => {
  const logger = pino()
  if (config.logger.level) {
    logger.level = config.logger.level
  }

  const promises: Array<Promise<void>> = []

  const secrets = new LocalSecretService(config, logger)

  const kysley = new KyselyDatabase(config.postgres)

  const jwt = new JWTService<CoreUserSession>(async () => {
    return []
  }, logger)
  promises.push(jwt.init())

  const sessionService = new VrameworkSessionService(jwt, async (apiKey: string) => {
    return {} as any
  })

  const content = new LocalContent(config, logger)

  const email = {
    sendGreedingCard: console.log
  }

  await Promise.all(promises)
  
  const singletonServices = { config, content, logger, secrets, sessionService, jwt, email, kysley }

  const createSessionServices = (singletonServices: SingletonServices, session: UserSession): Services => {
    return {
      ...singletonServices,
    } as never as Services
  }

  return { ...singletonServices, createSessionServices } as never as SingletonServices
}