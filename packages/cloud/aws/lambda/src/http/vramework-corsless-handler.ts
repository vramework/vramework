import { APIGatewayProxyEvent } from 'aws-lambda'
import {
  CoreServices,
  CoreSingletonServices,
  CoreUserSession,
  CreateSessionServices,
} from '@vramework/core'
import { generalHTTPHandler } from './general-http-handler.js'
import { VrameworkAPIGatewayLambdaRequest } from '../vramework-api-gateway-lambda-request.js'
import { VrameworkAPIGatewayLambdaResponse } from '../vramework-api-gateway-lambda-response.js'

export const vrameworkCorslessHandler = async <SingletonServices extends CoreSingletonServices, Services extends CoreServices<SingletonServices>, UserSession extends CoreUserSession>(
  event: APIGatewayProxyEvent,
  singletonServices: SingletonServices,
  createSessionServices: CreateSessionServices<
    SingletonServices,
    UserSession,
    Services
  >
) => {
  const request = new VrameworkAPIGatewayLambdaRequest(event)
  const response = new VrameworkAPIGatewayLambdaResponse()
  return await generalHTTPHandler(
    singletonServices,
    createSessionServices,
    request,
    response
  )
}
