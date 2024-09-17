import { join } from 'path'

import { loadRoutes, verifyRoutes } from './api-routes'
import { loadSchemas } from './schema'
import { CoreAPIRoutes } from './routes'
import { VrameworkConfig } from './types'
import { Logger } from './services'

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
): Promise<{ routes: CoreAPIRoutes }> => {
  await loadSchemas(join(config.rootDir, config.schemaOutputDirectory))
  const { apiRoutes, filesWithRoutes } = await loadRoutes(
    config.rootDir,
    config.routeDirectories
  )
  logger.info(`Routes files loaded: \n\t${filesWithRoutes.join('\n\t')}`)
  await verifyRoutes(apiRoutes)
  return { routes: apiRoutes }
}
