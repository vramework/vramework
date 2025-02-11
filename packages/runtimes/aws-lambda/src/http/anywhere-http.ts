import {
  CoreSingletonServices,
  CoreServices,
  CreateSessionServices,
  CoreUserSession,
} from '@pikku/core'
import { APIGatewayProxyEvent } from 'aws-lambda'
import { generalHTTPHandler } from './general-http-handler.js'
import { PikkuAPIGatewayLambdaRequest } from '../pikku-api-gateway-lambda-request.js'
import { PikkuAPIGatewayLambdaResponse } from '../pikku-api-gateway-lambda-response.js'

export const anywhereHTTP = async <
  SingletonServices extends CoreSingletonServices,
  Services extends CoreServices<SingletonServices>,
>(
  event: APIGatewayProxyEvent,
  singletonServices: SingletonServices,
  createSessionServices: CreateSessionServices<
    SingletonServices,
    Services,
    CoreUserSession
  >
) => {
  const request = new PikkuAPIGatewayLambdaRequest(event)
  const response = new PikkuAPIGatewayLambdaResponse()
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
