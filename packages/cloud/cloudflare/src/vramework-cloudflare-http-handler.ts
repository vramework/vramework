import {
  CoreServices,
  CoreSingletonServices,
  CoreUserSession,
  CreateSessionServices,
} from '@vramework/core'
import { VrameworkCloudflareHTTPRequest } from './vramework-cloudflare-http-request.js'
import { VrameworkCloudflareHTTPResponse } from './vramework-cloudflare-http-response.js'
import { runHTTPRoute } from '@vramework/core/http'
import type { Request, IncomingRequestCfProperties } from '@cloudflare/workers-types'

export const vrameworkCloudflareHTTPHandler = async <SingletonServices extends CoreSingletonServices, Services extends CoreServices<SingletonServices>, UserSession extends CoreUserSession>(
  cloudflareRequest: Request<unknown, IncomingRequestCfProperties<unknown>>,
  singletonServices: SingletonServices,
  createSessionServices: CreateSessionServices<
    SingletonServices,
    UserSession,
    Services
  >
) => {
  const request = new VrameworkCloudflareHTTPRequest(cloudflareRequest)
  const response = new VrameworkCloudflareHTTPResponse()
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
