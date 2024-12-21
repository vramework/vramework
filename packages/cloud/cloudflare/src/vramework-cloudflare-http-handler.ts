import {
  CoreServices,
  CoreSingletonServices,
  CoreUserSession,
  CreateSessionServices,
} from '@vramework/core'
import { CloudflareHTTPRequest } from './vramework-cloudflare-http-request.js'
import { CloudfrontHTTPResponse } from './vramework-cloudflare-http-response.js'
import { runHTTPRoute } from '@vramework/core/http'
import type { Request, IncomingRequestCfProperties } from '@cloudflare/workers-types'

export const httpHandler = async <SingletonServices extends CoreSingletonServices, Services extends CoreServices<SingletonServices>, UserSession extends CoreUserSession>(
  cloudflareRequest: Request<unknown, IncomingRequestCfProperties<unknown>>,
  singletonServices: SingletonServices,
  createSessionServices: CreateSessionServices<
    SingletonServices,
    Services,
    UserSession
  >
) => {
  const request = new CloudflareHTTPRequest(cloudflareRequest)
  const response = new CloudfrontHTTPResponse()
  await runHTTPRoute({
    request,
    response,
    singletonServices,
    createSessionServices: createSessionServices as any,
    route: request.getPath(),
    method: request.getMethod(),
  })
  return response.getCloudflareResponse()
}
