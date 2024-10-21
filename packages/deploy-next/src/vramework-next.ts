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
  CreateSessionServices,
} from '@vramework/core/types/core.types'
import { APIRouteMethod } from '@vramework/core/types/routes.types'
import { runRoute } from '@vramework/core/route-runner'

const injectIntoUrl = (route: string, keys: Record<string, string>) => {
  const path = compile(route)
  return path(keys)
}
export class VrameworkNextJS {
  private readyEmitter = new EventEmitter()
  private singletonServices: CoreSingletonServices | undefined

  constructor(
    private readonly config: CoreConfig,
    private readonly createSingletonServices: (
      config: CoreConfig
    ) => Promise<CoreSingletonServices>,
    private readonly createSessionServices: CreateSessionServices<any, any, any>
  ) {}

  public async actionRequest<In extends Record<string, any>, Out>(
    route: unknown,
    method: unknown,
    data: In
  ): Promise<Out> {
    const singletonServices = await this.getSingletonServices()
    return await runRoute<In, Out>(
      new VrameworkActionNextRequest(data),
      new VrameworkActionNextResponse(),
      singletonServices,
      this.createSessionServices,
      {
        route: injectIntoUrl(route as string, data),
        method: method as APIRouteMethod,
      }
    )
  }

  public async staticActionRequest<In extends Record<string, any>, Out>(
    route: unknown,
    method: unknown,
    data: In
  ): Promise<Out> {
    const singletonServices = await this.getSingletonServices()
    return await runRoute<In, Out>(
      new VrameworkActionStaticNextRequest(data),
      new VrameworkActionNextResponse(),
      singletonServices,
      this.createSessionServices,
      {
        route: injectIntoUrl(route as string, data),
        method: method as APIRouteMethod,
        skipUserSession: true,
      }
    )
  }

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
    return await runRoute<In, Out>(
      new VrameworkSSRNextRequest(request, data),
      new VrameworkSSRNextResponse(response),
      singletonServices,
      this.createSessionServices,
      {
        route: injectIntoUrl(route, data),
        method,
      }
    )
  }

  public async apiRequest<In extends Record<string, any>, Out>(
    request: NextApiRequest,
    response: NextApiResponse,
    route: string,
    method: APIRouteMethod
  ): Promise<void> {
    const singletonServices = await this.getSingletonServices()
    const vrameworkRequest = new VrameworkAPINextRequest(request)
    const vrameworkResponse = new VrameworkAPINextResponse(response)
    const data = await vrameworkRequest.getData()
    await runRoute<In, Out>(
      vrameworkRequest,
      vrameworkResponse,
      singletonServices,
      this.createSessionServices,
      {
        route: injectIntoUrl(route, data),
        method,
      }
    )
  }

  private async getSingletonServices(): Promise<CoreSingletonServices> {
    if (this.singletonServices) {
      return this.singletonServices
    }

    if (this.readyEmitter.listenerCount('ready') === 0) {
      this.createSingletonServices(this.config).then((singletonServices) => {
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
