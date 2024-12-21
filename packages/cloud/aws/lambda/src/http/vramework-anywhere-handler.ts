import { CoreSingletonServices, CoreServices, CreateSessionServices, CoreUserSession } from "@vramework/core"
import { APIGatewayProxyEvent } from "aws-lambda"
import { generalHTTPHandler } from "./general-http-handler.js"
import { VrameworkAPIGatewayLambdaRequest } from "../vramework-api-gateway-lambda-request.js"
import { VrameworkAPIGatewayLambdaResponse } from "../vramework-api-gateway-lambda-response.js"

export const vrameworkAnywhereHandler = async <SingletonServices extends CoreSingletonServices, Services extends CoreServices<SingletonServices>>(
    event: APIGatewayProxyEvent,
    singletonServices: SingletonServices,
    createSessionServices: CreateSessionServices<
      SingletonServices,
      Services,
      CoreUserSession
    >
  ) => {
    const request = new VrameworkAPIGatewayLambdaRequest(event)
    const response = new VrameworkAPIGatewayLambdaResponse()
    if (event.headers.origin) {
      response.setHeader(
        'Access-Control-Allow-Origin',
        event.headers.origin.toString()
      )
    }
    response.setHeader('Access-Control-Allow-Credentials', true)
    return await generalHTTPHandler(
      singletonServices,
      createSessionServices,
      request,
      response
    )
  }
  
  