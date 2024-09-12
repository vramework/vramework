import { runRoute } from "@vramework/core/matching-routes";
import { CoreAPIRoute, CoreAPIRoutes } from '@vramework/core/routes';
import { CoreSingletonServices, CreateSessionServices } from "@vramework/core/types";
import { IncomingMessage, ServerResponse } from 'http';

export class VrameworkNextJS<APIRoutes> {
    constructor(
        private readonly routes: APIRoutes,
        private readonly singletonServices: CoreSingletonServices,
        private readonly createSessionServices: CreateSessionServices,
    ) {
    }

    public async request <In, Out, R extends Pick<CoreAPIRoute<In, Out>, 'route' | 'type'>>(
        request: IncomingMessage & { cookies: Partial<{ [key: string]: string; }>; }, 
        response: ServerResponse<IncomingMessage>, 
        route: R, 
        data: In
    ): Promise<Out> {
        return await runRoute<Out>(
            this.singletonServices, 
            this.createSessionServices, 
            this.routes as unknown as CoreAPIRoutes,
            route,
            request.headers as any,
            { request, response },
            data  
        )     
    }
}

