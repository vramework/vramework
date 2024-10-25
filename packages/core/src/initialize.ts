import { validateAllSchemasLoaded } from './schema.js'
import { Logger } from './services/index.js'
import { getRoutes } from './route-runner.js'

/**
 * Initializes the Vramework core.
 * @param logger - A logger for logging information.
 * @returns A promise that resolves to an object containing the loaded API routes.
 */
export const initializeVrameworkCore = async (logger: Logger) => {
  logger.info(`Initializing Vramework Core`)

  const { routes, routesMeta } = getRoutes()
  let routesDebugMessage = 'Routes loading:'
  for (const { method, route } of routes) {
    routesDebugMessage += `\n\t- ${method.toUpperCase()} -> ${route}`
  }
  logger.debug(routesDebugMessage)
  logger.info(`Routes loaded`)

  await validateAllSchemasLoaded(logger, routesMeta)

  return { routes, routesMeta }
}
