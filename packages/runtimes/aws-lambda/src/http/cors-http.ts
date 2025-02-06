import type { CoreSingletonServices, CoreServices, CreateSessionServices, CoreUserSession } from "@vramework/core"
import type { APIGatewayProxyEvent } from "aws-lambda"
import type { Logger } from "@vramework/core/services"

import { generalHTTPHandler } from "./general-http-handler.js"
import { InvalidOriginError } from "@vramework/core/errors"
import { VrameworkAPIGatewayLambdaResponse } from "../vramework-api-gateway-lambda-response.js"
import { VrameworkAPIGatewayLambdaRequest } from "../vramework-api-gateway-lambda-request.js"

const validateOrigin = (
    allowsOrigins: string[],
    logger: Logger,
    event: APIGatewayProxyEvent
): string => {
    const origin = event.headers.origin
    if (!origin || allowsOrigins.every((domain) => !origin.includes(domain))) {
        logger.error(`
  CORS Error
    - Recieved from origin: ${origin}
    - Expected domain(s): ${allowsOrigins.join(', ')}
    - Host: ${event.headers.host}
    - Path: ${event.path}
    - Headers: ${JSON.stringify(event.headers, null, '\t')}
  `)
        throw new InvalidOriginError()
    }

    return origin
}

export const corsHTTP = async <SingletonServices extends CoreSingletonServices, Services extends CoreServices<SingletonServices>, UserSession extends CoreUserSession>(
    event: APIGatewayProxyEvent,
    allowedOrigins: string[],
    singletonServices: SingletonServices,
    createSessionServices: CreateSessionServices<
        SingletonServices,
        Services,
        UserSession
    >
) => {
    const request = new VrameworkAPIGatewayLambdaRequest(event)
    const response = new VrameworkAPIGatewayLambdaResponse()

    let origin: string | false = false
    try {
        origin = validateOrigin(allowedOrigins, singletonServices.logger, event)
    } catch {
        response.setStatus(400)
        response.setJson({ error: 'error.invalid_origin' })
    }

    response.setHeader('Access-Control-Allow-Origin', origin)
    response.setHeader('Access-Control-Allow-Credentials', true)

    return await generalHTTPHandler(
        singletonServices,
        createSessionServices,
        request,
        response
    )
}
