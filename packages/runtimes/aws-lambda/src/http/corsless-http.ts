import { APIGatewayProxyEvent } from 'aws-lambda'
import {
  CoreServices,
  CoreSingletonServices,
  CoreUserSession,
  CreateSessionServices,
} from '@pikku/core'
import { generalHTTPHandler } from './general-http-handler.js'
import { PikkuAPIGatewayLambdaRequest } from '../pikku-api-gateway-lambda-request.js'
import { PikkuAPIGatewayLambdaResponse } from '../pikku-api-gateway-lambda-response.js'

export const corslessHTTP = async <SingletonServices extends CoreSingletonServices, Services extends CoreServices<SingletonServices>, UserSession extends CoreUserSession>(
  event: APIGatewayProxyEvent,
  singletonServices: SingletonServices,
  createSessionServices: CreateSessionServices<
    SingletonServices,
    Services,
    UserSession
  >
) => {
  const request = new PikkuAPIGatewayLambdaRequest(event)
  const response = new PikkuAPIGatewayLambdaResponse()
  return await generalHTTPHandler(
    singletonServices,
    createSessionServices,
    request,
    response
  )
}
