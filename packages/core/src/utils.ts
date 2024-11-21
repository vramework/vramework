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
