export const serializeFetchWrapper = (routesMapPath: string) => {
    return `import { CoreVrameworkFetch, HTTPMethod, CoreVrameworkFetchOptions } from '@vramework/fetch/index'

import type { RoutesMap, RouteHandlerOf } from '${routesMapPath}'

export class VrameworkFetch {
    private client: CoreVrameworkFetch;
    constructor(options: CoreVrameworkFetchOptions) {
        this.client = new CoreVrameworkFetch(options)
    }

    public setServerUrl(serverUrl: string): void {
        this.client.setServerUrl(serverUrl)
    }

    public setAuthorizationJWT(jwt: string): void {
        this.client.setAuthorizationJWT(jwt)
    }

    public setAPIKey(apiKey?: string): void {
        this.client.setAPIKey(apiKey)
    }

    public async api<
        Route extends keyof RoutesMap,
        Method extends keyof RoutesMap[Route]
    >(route: Route, method: Method, data: RouteHandlerOf<Route, Method>['input'], options?: Omit<RequestInit, 'body'>): Promise<RouteHandlerOf<Route, Method>['output']> {
        return this.client.fetch(route, method as unknown as HTTPMethod, data, options)
    }

    public async fetch<
        Route extends keyof RoutesMap,
        Method extends keyof RoutesMap[Route]
    >(route: Route, method: Method, data: RouteHandlerOf<Route, Method>['input'], options?: Omit<RequestInit, 'body'>): Promise<Response> {
        return this.client.fetch(route, method as unknown as HTTPMethod, data, options)
    }
}
`

}