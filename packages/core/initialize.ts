import { join } from 'path'

import { loadRoutes } from './api-routes'
import { loadSchemas } from './schema'
import { CoreAPIRoutes } from './routes'
import { VrameworkConfig } from './types'
import { Logger } from './services'

export const initializeVrameworkCore = async (
  logger:Logger,
  config: VrameworkConfig
): Promise<{ routes: CoreAPIRoutes }> => {
  await loadSchemas(join(config.rootDir, config.schemaOutputDirectory))
  const { apiRoutes, filesWithRoutes } = await loadRoutes(config.rootDir, config.routeDirectories)
  logger.info(`Routes files loaded: \n\t${filesWithRoutes.join('\n\t')}`)
  return { routes: apiRoutes }
}
