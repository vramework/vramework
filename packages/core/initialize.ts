import { join } from 'path'

import { loadSchema, loadSchemas } from './schema'
import { VrameworkConfig } from './types'
import { Logger } from './services'
import { getRoutes } from './router-runner'
import { CoreAPIRoutes } from './routes'

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
  const { routesMeta } = await import(join(config.rootDir, config.routesOutputFile))
  logger.info('Routes files loaded')

  const routes: CoreAPIRoutes = getRoutes()

  await loadSchemas(join(config.rootDir, config.schemaOutputDirectory))
  routesMeta.forEach((route: any) => {
    if (route.input) {
      logger.debug(`Loading schema ${route.input}`)
      loadSchema(route.input, logger)
    }
  })
  logger.info(`Schemas loaded`)

  return routes
}
