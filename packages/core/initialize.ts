import { join } from 'path'

import { loadSchema, loadSchemas } from './schema'
import { VrameworkConfig } from './types/core.types'
import { Logger } from './services'
import { getRoutes } from './route-runner'

/**
 * Initializes the Vramework core.
 * @param logger - A logger for logging information.
 * @param config - The configuration object for Vramework.
 * @returns A promise that resolves to an object containing the loaded API routes.
 * @description This function initializes the Vramework core by loading schemas, loading routes, logging the loaded route files, verifying the routes, and returning the loaded API routes.
 */
export const initializeVrameworkCore = async (
  logger: Logger,
  config: VrameworkConfig
) => {
  logger.info(`Starting Vramework`)

  const { routes, routesMeta } = getRoutes()
  let routesDebugMessage = 'Routes loading:'
  for (const { method, route } of routes) {
    routesDebugMessage += `\n\t- ${method.toUpperCase()} -> ${route}`
  }
  logger.debug(routesDebugMessage)
  logger.info(`Routes loaded`)

  await loadSchemas(join(config.rootDir, config.schemaOutputDirectory))
  routesMeta.forEach((route: any) => {
    if (route.input) {
      loadSchema(route.input, logger)
    }
  })
  logger.info(`Schemas loaded`)

  return { routes, routesMeta }
}
