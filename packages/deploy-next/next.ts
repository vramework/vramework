import { runRoute } from "@vramework/core/matching-routes";
import { CoreAPIRoute, CoreAPIRoutes } from '@vramework/core/routes';
import { CoreSingletonServices, CreateSessionServices } from "@vramework/core/types";
import { IncomingMessage, ServerResponse } from 'http';

export class VrameworkNextJS {
    constructor(
        private readonly routes: CoreAPIRoutes,
        private readonly singletonServices: CoreSingletonServices,
        private readonly createSessionServices: CreateSessionServices,
    ) {
    }

    public async request <In, Out>(
        request: IncomingMessage & { cookies: Partial<{ [key: string]: string; }>; }, 
        response: ServerResponse<IncomingMessage>, 
        route: Pick<CoreAPIRoute<In, Out>, 'route' | 'type'>, 
        data: In
    ): Promise<Out> {
        return await runRoute<Out>(
            this.singletonServices, 
            this.createSessionServices, 
            this.routes,
            route,
            request.headers as any,
            { request, response },
            data  
        )     
    }
}

