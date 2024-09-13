import { runRoute } from "@vramework/core/matching-routes";
import { CoreAPIRoute, CoreAPIRoutes } from '@vramework/core/routes';
import { CoreSingletonServices, CreateSessionServices } from "@vramework/core/types";
import { injectIntoUrl, mergeData } from "@vramework/core/utils";
import { IncomingMessage, ServerResponse } from 'http';
import { NextApiRequest, NextApiResponse } from "next";
import { VrameworkSSRNextRequest } from "./vramework-ssr-next-request";
import { VrameworkSSRNextResponse } from "./vramework-ssr-next-response";
import { VrameworkAPINextRequest } from "./vramework-api-next-request";
import { VrameworkAPINextResponse } from "./vramework-api-next-response";

export class VrameworkNextJS<APIRoutes> {
    constructor(
        private readonly routes: APIRoutes,
        private readonly singletonServices: CoreSingletonServices,
        private readonly createSessionServices: CreateSessionServices,
    ) {
    }

    public async ssrRequest <In, Out, R extends Pick<CoreAPIRoute<In, Out>, 'route' | 'type'>>(
        request: IncomingMessage & { cookies: Partial<{ [key: string]: string; }>; }, 
        response: ServerResponse<IncomingMessage>, 
        route: R, 
        data: In
    ): Promise<Out> {
        return await runRoute<In, Out>(
            new VrameworkSSRNextRequest(request, data),
            new VrameworkSSRNextResponse(response),
            this.singletonServices, 
            this.createSessionServices, 
            this.routes as unknown as CoreAPIRoutes,
            route,
        )     
    }

    public async apiRequest <In, Out, R extends Pick<CoreAPIRoute<In, Out>, 'route' | 'type'>>(
        request: NextApiRequest, 
        response: NextApiResponse,
        route: R
    ): Promise<void> {
        const vrameworkRequest = new VrameworkAPINextRequest(request)
        const vrameworkResponse = new VrameworkAPINextResponse(response)
        const injectedRoute = { 
            route: injectIntoUrl(route.route, vrameworkRequest.getData()),
            type: route.type,
        }
        console.log(injectedRoute)
        await runRoute<In, Out>(
            vrameworkRequest,
            vrameworkResponse,
            this.singletonServices, 
            this.createSessionServices, 
            this.routes as unknown as CoreAPIRoutes,
            injectedRoute,
        )
    }
}

