import { CoreAPIRoute, CoreAPIRoutes } from '@vramework/core/routes';
import { CoreConfig, CoreSingletonServices, CreateSessionServices } from "@vramework/core/types";
import { injectIntoUrl } from "@vramework/core/utils";
import { IncomingMessage, ServerResponse } from 'http';
import { NextApiRequest, NextApiResponse } from "next";
import { VrameworkSSRNextRequest } from "./vramework-ssr-next-request";
import { VrameworkSSRNextResponse } from "./vramework-ssr-next-response";
import { VrameworkAPINextRequest } from "./vramework-api-next-request";
import { VrameworkAPINextResponse } from "./vramework-api-next-response";
import { VrameworkActionNextRequest } from './vramework-action-next-request';
import { VrameworkActionNextResponse } from './vramework-action-next-response';
import { EventEmitter } from 'eventemitter3'
import { runRoute } from '@vramework/core/router-runner';

export class VrameworkNextJS<APIRoutes> {
    private readyEmitter = new EventEmitter()
    private singletonServices: CoreSingletonServices | undefined

    constructor(
        private readonly config: CoreConfig,
        private readonly routes: APIRoutes,
        private readonly createSingletonServices: (config: CoreConfig) => Promise<CoreSingletonServices>,
        private readonly createSessionServices: CreateSessionServices,
    ) {
    }

    public async actionRequest<In extends Record<string, any>, Out, R extends Pick<CoreAPIRoute<In, Out>, 'route' | 'type'>>(
        route: R,
        data: In 
    ): Promise<Out> {
        const singletonServices = await this.getSingletonServices()
        return await runRoute<In, Out>(
            new VrameworkActionNextRequest(data),
            new VrameworkActionNextResponse(),
            singletonServices,
            this.createSessionServices,
            this.routes as unknown as CoreAPIRoutes,
            {
                route: injectIntoUrl(route.route, data),
                type: route.type,
            }
        )
    }

    public async ssrRequest<In extends Record<string, any>, Out, R extends Pick<CoreAPIRoute<In, Out>, 'route' | 'type'>>(
        request: IncomingMessage & { cookies: Partial<{ [key: string]: string; }>; },
        response: ServerResponse<IncomingMessage>,
        route: R,
        data: In
    ): Promise<Out> {
        const singletonServices = await this.getSingletonServices()
        return await runRoute<In, Out>(
            new VrameworkSSRNextRequest(request, data),
            new VrameworkSSRNextResponse(response),
            singletonServices,
            this.createSessionServices,
            this.routes as unknown as CoreAPIRoutes,
            {
                route: injectIntoUrl(route.route, data),
                type: route.type,
            }
        )
    }

    public async apiRequest<In extends Record<string, any>, Out, R extends Pick<CoreAPIRoute<In, Out>, 'route' | 'type'>>(
        request: NextApiRequest,
        response: NextApiResponse,
        route: R
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
            this.routes as unknown as CoreAPIRoutes,
            {
                route: injectIntoUrl(route.route, data),
                type: route.type,
            }
        )
    }

    private async getSingletonServices(): Promise<CoreSingletonServices> {
        if (this.singletonServices) {
            return this.singletonServices
        }

        if (this.readyEmitter.listenerCount('ready') === 0) {
            this.createSingletonServices(this.config)
                .then((singletonServices) => {
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

