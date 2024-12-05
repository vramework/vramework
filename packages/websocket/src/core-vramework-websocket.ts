import { CoreVrameworkRouteHandler } from "./core-vramework-route-handler.js";

let WebSocketClass: typeof WebSocket;

if (typeof WebSocket !== 'undefined') {
  WebSocketClass = WebSocket;
} else {
  try {
    WebSocketClass = require('ws')
  } catch (e) {
    console.error("WebSocket not supported and `ws` library is not available.");
    process.exit(1)
  }
}

/**
 * The `CoreVrameworkWebsocket` class provides a utility for making websocket connections, including handling authorization,
 * and managing server URLs. This class is designed to simplify API interactions
 * with configurable options and support for JWT and API key-based authentication.
 */
export class CoreVrameworkWebsocket {
  public ws: WebSocket
  
  private routes = new Map<string, CoreVrameworkRouteHandler>()
  private subscriptions = new Set<(data: unknown) => void>()

  /**
   * Constructs a new instance of the `CoreVrameworkFetch` class.
   */
  constructor(url: string | URL, protocols?: string | string[]) {
    this.ws = new WebSocketClass(url, protocols)
    this.ws.onmessage = this.handleMessage.bind(this)
  }

  public getRoute(route: string | symbol | number): CoreVrameworkRouteHandler {
    const route2 = route.toString()
    let routeHandler = this.routes.get(route2)
    if (!routeHandler) {
      routeHandler = new CoreVrameworkRouteHandler(route2, this.ws.send.bind(this.ws))
      this.routes.set(route2, routeHandler)
    }
    return routeHandler
  }

  public send(data: unknown) {
    this.ws.send(JSON.stringify(data))
  }

  public onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null = null

  public subscribe(callback: (data: any) => void) {
    this.subscriptions.add(callback)
  }

  public unsubscribe(callback?: (data: any) => void) {
    if (callback) {
      this.subscriptions.delete(callback)
    } else {
      this.subscriptions.clear()
    }
  }

  private handleMessage(event: MessageEvent) {
    let parsed = false
    try {
      if (typeof event.data === 'string') {
        const json = JSON.parse(event.data)
        parsed = true
        for (const [type, routeHandler] of this.routes) {
          const route = json[type]
          if (route) {
            routeHandler.handleMessage(json[type], json)
          }
        }
        this.subscriptions.forEach((subscription) => subscription(json))
      }
    } catch (error) {
      // Error parsing means we'll just bubble it to the normal onmessage handler
    }

    if (!parsed) {
      this.subscriptions.forEach((subscription) => subscription(event.data))
    }

    if (this.onmessage) {
      this.onmessage.call(this.ws, event)
    }
  }
}
