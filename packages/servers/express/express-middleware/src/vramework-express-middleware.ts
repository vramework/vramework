import { CoreServices, CoreSingletonServices, CoreUserSession, CreateSessionServices, runRoute, RunRouteOptions } from "@vramework/core"
import { RequestHandler } from "express"
import { VrameworkExpressRequest } from "./vramework-express-request.js"
import { VrameworkExpressResponse } from "./vramework-express-response.js"

export const vrameworkMiddleware = (singletonServices: CoreSingletonServices, createSessionServices: CreateSessionServices<CoreSingletonServices, CoreUserSession, CoreServices>, { set404Status }: RunRouteOptions): RequestHandler => async (req, res, next) => {
    try {
        await runRoute(
            new VrameworkExpressRequest(req),
            new VrameworkExpressResponse(res),
            singletonServices,
            createSessionServices,
            {
                method: req.method.toLowerCase() as any,
                route: req.path,
                set404Status
            }
        )
    } catch (e) {
        // Error should have already been handled by runRoute
    }

    next()
}