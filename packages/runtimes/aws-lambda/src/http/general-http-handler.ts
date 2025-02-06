import { CoreSingletonServices, CoreServices, CreateSessionServices, CoreUserSession } from "@vramework/core"
import { runHTTPRoute } from "@vramework/core/http"
import { APIGatewayProxyResult } from "aws-lambda"
import { VrameworkAPIGatewayLambdaRequest } from "../vramework-api-gateway-lambda-request.js"
import { VrameworkAPIGatewayLambdaResponse } from "../vramework-api-gateway-lambda-response.js"

export const generalHTTPHandler = async <SingletonServices extends CoreSingletonServices, Services extends CoreServices<SingletonServices>, UserSession extends CoreUserSession>(
  singletonServices: SingletonServices,
  createSessionServices: CreateSessionServices<
    SingletonServices,
    Services,
    UserSession
  >,
  request: VrameworkAPIGatewayLambdaRequest,
  response: VrameworkAPIGatewayLambdaResponse
): Promise<APIGatewayProxyResult> => {
  if (request.getMethod() === 'options') {
    response.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'
    )
    response.setHeader(
      'Access-Control-Allow-Methods',
      'OPTIONS,DELETE,GET,HEAD,PATCH,POST,PUT'
    )
    response.setStatus(200)
    response.setJson({})
    return response.getLambdaResponse()
  }

  if (request.getPath().includes('health-check')) {
    response.setStatus(200)
    return response.getLambdaResponse()
  }

  try {
    await runHTTPRoute({
      request,
      response,
      singletonServices,
      createSessionServices: createSessionServices as any,
      route: request.getPath(),
      method: request.getMethod() as any,
    })
  } catch {
    // Error should have already been handled by runHTTPRoute
  }

  return response.getLambdaResponse()
}