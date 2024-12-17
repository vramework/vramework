import { coerceQueryStringToArray, loadSchema, validateJson } from './schema.js'
import { Logger } from './services/logger.js'

// TODO: SessionServices probably needs it's own type
// but is an issue for the future and will be tackled 
// with dependency injection
export const closeServices = async (
  logger: Logger,
  sessionServices?: Record<string, any>
) => {
  if (sessionServices) {
    await Promise.all(
      Object.values(sessionServices).map(async (service) => {
        if (service?.close) {
          try {
            await service.close()
          } catch (e: any) {
            logger.error(e)
          }
        }
      })
    )
  }
}

export const validateAndCoerce = (
  logger: Logger,
  schemaName: string | undefined | null,
  data: any,
  coerceToArray: boolean
) => {
  if (schemaName) {
    loadSchema(schemaName, logger)
    if (coerceToArray) {
      coerceQueryStringToArray(schemaName, data)
    }
    validateJson(schemaName, data)
  }
}
