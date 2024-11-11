export const serializeNextJsWrapper = (
  routesPath: string,
  routesMapPath: string,
  schemasPath: string,
  configImport: string,
  singleServicesFactoryImport: string,
  sessionServicesImport: string
) => {
  return `'server-only'

/**
 * This file provides a wrapper around the VrameworkNextJS class to allow for methods to be type checked against your routes.
 * This ensures type safety for route handling methods when integrating with the \`@vramework/core\` framework.
 */
import { VrameworkNextJS } from '@vramework/next'
import type { IncomingMessage, ServerResponse } from 'http'
import type { NextApiRequest, NextApiResponse } from 'next/dist/shared/lib/utils'
import type { APIRouteMethod } from '@vramework/core/types/routes.types'
import type { RoutesMap, RouteHandlerOf } from '${routesMapPath}'

${configImport}
${singleServicesFactoryImport}
${sessionServicesImport}

import '${routesPath}'
import '${schemasPath}'

let _vramework: VrameworkNextJS | undefined

/**
 * Initializes and returns an instance of VrameworkNextJS with helper methods for handling route requests.
 *
 * @returns An object containing methods for making action requests, SSR requests, and API requests.
 */
export const vramework = () => {
  if (!_vramework) {
    _vramework = new VrameworkNextJS(
      createConfig(),
      createSingletonServices as any,
      createSessionServices
    )
  }

  /**
   * Makes an action request for a specified route and method.
   *
   * @template Route - The route key from the RoutesMap.
   * @template Method - The method key from the specified route.
   * @param route - The route to make the request to.
   * @param method - The method to be used for the request.
   * @param data - The input data for the request.
   * @returns A promise that resolves to the output of the route handler.
   */
  const actionRequest = async <
    Route extends keyof RoutesMap,
    Method extends keyof RoutesMap[Route]
  >(
    route: Route,
    method: Method,
    data: RouteHandlerOf<Route, Method>['input']
  ): Promise<RouteHandlerOf<Route, Method>['output']> => {
    return _vramework!.actionRequest(route, method, data as any)
  }

  /**
   * Makes a static action request for a specified route and method.
   *
   * @template Route - The route key from the RoutesMap.
   * @template Method - The method key from the specified route.
   * @param route - The route to make the request to.
   * @param method - The method to be used for the request.
   * @param data - The input data for the request.
   * @returns A promise that resolves to the output of the route handler.
   */
  const staticActionRequest = async <
    Route extends keyof RoutesMap,
    Method extends keyof RoutesMap[Route]
  >(
    route: Route,
    method: Method,
    data: RouteHandlerOf<Route, Method>['input']
  ): Promise<RouteHandlerOf<Route, Method>['output']> => {
    return _vramework!.staticActionRequest(route, method, data as any)
  }

  /**
   * Makes a server-side rendering (SSR) request for a specified route and method.
   *
   * @template Route - The route key from the RoutesMap.
   * @template Method - The method key from the specified route.
   * @param request - The incoming HTTP request object with cookies.
   * @param response - The outgoing HTTP response object.
   * @param route - The route to make the request to.
   * @param method - The method to be used for the request.
   * @param data - The input data for the request.
   * @returns A promise that resolves to the output of the route handler.
   */
  const ssrRequest = <Route extends keyof RoutesMap, Method extends keyof RoutesMap[Route]>(
    request: IncomingMessage & {
      cookies: Partial<{ [key: string]: string }>;
    },
    response: ServerResponse<IncomingMessage>,
    route: Route,
    method: Method,
    data: RouteHandlerOf<Route, Method>['input']
  ): Promise<RouteHandlerOf<Route, Method>['output']> => {
    return _vramework!.ssrRequest(request, response, route, method as APIRouteMethod, data as any)
  }

  /**
   * Handles an API request for a specified route and method.
   *
   * @template Route - The route key from the RoutesMap.
   * @template Method - The method key from the specified route.
   * @param request - The incoming Next.js API request object.
   * @param response - The outgoing Next.js API response object.
   * @param route - The route to make the request to.
   * @param method - The method to be used for the request.
   * @returns A promise that resolves when the request is handled.
   */
  const apiRequest = <Route extends keyof RoutesMap, Method extends keyof RoutesMap[Route]>(
    request: NextApiRequest,
    response: NextApiResponse,
    route: Route,
    method: Method,
  ): Promise<void> => {
    return _vramework!.apiRequest(request, response, route, method as APIRouteMethod)
  }

  return {
    staticActionRequest,
    actionRequest,
    apiRequest,
    ssrRequest
  }
}`
}
