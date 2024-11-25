import { compile } from 'path-to-regexp'
import { IncomingMessage, ServerResponse } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'
import { EventEmitter } from 'eventemitter3'

import { VrameworkSSRNextRequest } from './vramework-ssr-next-request.js'
import { VrameworkSSRNextResponse } from './vramework-ssr-next-response.js'
import { VrameworkAPINextRequest } from './vramework-api-next-request.js'
import { VrameworkAPINextResponse } from './vramework-api-next-response.js'
import { VrameworkActionNextRequest } from './vramework-action-next-request.js'
import { VrameworkActionNextResponse } from './vramework-action-next-response.js'
import { VrameworkActionStaticNextRequest } from './vramework-action-static-next-request.js'

import {
  CoreConfig,
  CoreSingletonServices,
  CreateConfig,
  CreateSessionServices,
} from '@vramework/core/types/core.types'
import { APIRouteMethod } from '@vramework/core/http/routes.types'
import { runRoute } from '@vramework/core/http/route-runner'

const injectIntoUrl = (route: string, keys: Record<string, string>) => {
  const path = compile(route)
  return path(keys)
}

/**
 * The `VrameworkNextJS` class provides methods to interact with the Vramework framework in a Next.js environment,
 * including support for SSR requests, API requests, and action requests.
 */
export class VrameworkNextJS {
  private readyEmitter = new EventEmitter()
  private singletonServices: CoreSingletonServices | undefined

  /**
   * Constructs a new instance of the `VrameworkNextJS` class.
   *
   * @param createConfig - A function that creates/gets the config used in vramework for the application.
   * @param createSingletonServices - A function that creates singleton services for the application.
   * @param createSessionServices - A function that creates session-specific services for each request.
   */
  constructor(
    private readonly createConfig: CreateConfig<CoreConfig>,
    private readonly createSingletonServices: (
      config: CoreConfig
    ) => Promise<CoreSingletonServices>,
    private readonly createSessionServices: CreateSessionServices<any, any, any>
  ) {}

  /**
   * Handles an action request, routing it to the appropriate handler.
   *
   * @param route - The route to handle.
   * @param method - The HTTP method for the request.
   * @param data - The data to be sent with the request.
   * @returns A promise that resolves to the response data.
   */
  public async actionRequest<In extends Record<string, any>, Out>(
    route: unknown,
    method: unknown,
    data: In
  ): Promise<Out> {
    const singletonServices = await this.getSingletonServices()
    return await runRoute<In, Out>({
      request: new VrameworkActionNextRequest<In>(data),
      response: new VrameworkActionNextResponse(),
      singletonServices,
      createSessionServices: this.createSessionServices,
      route: injectIntoUrl(route as string, data),
      method: method as APIRouteMethod,
    })
  }

  /**
   * Handles a static action request, routing it to the appropriate handler with user session skipping.
   *
   * @param route - The route to handle.
   * @param method - The HTTP method for the request.
   * @param data - The data to be sent with the request.
   * @returns A promise that resolves to the response data.
   */
  public async staticActionRequest<In extends Record<string, any>, Out>(
    route: unknown,
    method: unknown,
    data: In
  ): Promise<Out> {
    const singletonServices = await this.getSingletonServices()
    return await runRoute<In, Out>({
      request: new VrameworkActionStaticNextRequest(data),
      response: new VrameworkActionNextResponse(),
      singletonServices,
      createSessionServices: this.createSessionServices,
      route: injectIntoUrl(route as string, data),
      method: method as APIRouteMethod,
      skipUserSession: true,
    })
  }

  /**
   * Handles an SSR request, routing it to the appropriate handler.
   *
   * @param request - The incoming message request object.
   * @param response - The server response object.
   * @param route - The route to handle.
   * @param method - The HTTP method for the request.
   * @param data - The data to be sent with the request.
   * @returns A promise that resolves to the response data.
   */
  public async ssrRequest<In extends Record<string, any>, Out>(
    request: IncomingMessage & {
      cookies: Partial<{ [key: string]: string }>
    },
    response: ServerResponse<IncomingMessage>,
    route: string,
    method: APIRouteMethod,
    data: In
  ): Promise<Out> {
    const singletonServices = await this.getSingletonServices()
    return await runRoute<In, Out>({
      request: new VrameworkSSRNextRequest(request, data),
      response: new VrameworkSSRNextResponse(response),
      singletonServices,
      createSessionServices: this.createSessionServices,
      route: injectIntoUrl(route, data),
      method,
    })
  }

  /**
   * Handles an API request, routing it to the appropriate handler.
   *
   * @param request - The Next.js API request object.
   * @param response - The Next.js API response object.
   * @param route - The route to handle.
   * @param method - The HTTP method for the request.
   */
  public async apiRequest<In extends Record<string, any>, Out>(
    request: NextApiRequest,
    response: NextApiResponse,
    route: string,
    method: APIRouteMethod
  ): Promise<void> {
    const singletonServices = await this.getSingletonServices()
    const vrameworkRequest = new VrameworkAPINextRequest<In>(request)
    const vrameworkResponse = new VrameworkAPINextResponse(response)
    const data = await vrameworkRequest.getData()
    await runRoute<In, Out>({
      request: vrameworkRequest,
      response: vrameworkResponse,
      singletonServices,
      createSessionServices: this.createSessionServices,
      route: injectIntoUrl(route, data),
      method,
    })
  }

  /**
   * Retrieves the singleton services, ensuring they are only created once.
   *
   * @returns A promise that resolves to the singleton services.
   */
  private async getSingletonServices(): Promise<CoreSingletonServices> {
    if (this.singletonServices) {
      return this.singletonServices
    }

    if (this.readyEmitter.listenerCount('ready') === 0) {
      const config = await this.createConfig()
      this.createSingletonServices(config).then((singletonServices) => {
        this.singletonServices = singletonServices
        this.readyEmitter.emit('ready')
      })
    }

    return new Promise((resolve) => {
      this.readyEmitter.once('ready', async () => {
        resolve(this.singletonServices as CoreSingletonServices)
      })
    })
  }
}
