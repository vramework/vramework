import { coerceQueryStringToArray, loadSchema, validateJson } from "./schema.js"
import { Logger } from "./services/logger.js"
import { CoreServices } from "./types/core.types.js"

export const closeServices = async (logger: Logger, sessionServices?: CoreServices) => {
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

export const validateAndCoerce = (logger: Logger, schemaName: string | undefined | null, data: any, coerceToArray: boolean) => {
    if (schemaName) {
        loadSchema(schemaName, logger)
        if (coerceToArray) {
            coerceQueryStringToArray(schemaName, data)
        }
        validateJson(schemaName, data)
    }
}