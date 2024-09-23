import uWS from 'uWebSockets.js'

import {
  CoreConfig,
  CoreSingletonServices,
  CreateSessionServices,
  VrameworkConfig,
} from '@vramework/core/types'
import { initializeVrameworkCore } from '@vramework/core/initialize'
import { runRoute } from '@vramework/core/router-runner'
import { VrameworkUWSRequest } from './vramework-uws-request'
import { VrameworkUWSResponse } from './vramework-uws-response'

export class VrameworkUWSServer {
  public app = uWS.App()
  private listenSocket: boolean | uWS.us_listen_socket | null = null

  constructor(
    private readonly vrameworkConfig: VrameworkConfig,
    private readonly config: CoreConfig,
    private readonly singletonServices: CoreSingletonServices,
    private readonly createSessionServices: CreateSessionServices
  ) {}

  /**
   * Placeholder for enabling CORS
   */
  public enableCors(_options: any) {
    throw new Error('Method not implemented.')
  }

  public async init() {
    this.app.any('/*', async (res, req) => {
      try {
        await runRoute(
          new VrameworkUWSRequest(req, res),
          new VrameworkUWSResponse(res),
          this.singletonServices,
          this.createSessionServices,
          {
            method: req.getMethod() as any,
            route: req.getUrl() as string,
          }
        )
      } catch {
        // Error should have already been handled by runRoute
      }

      if (!res.writableEnded) {
        this.singletonServices.logger.error('Route did not send a response')
        res.status(500).end()
      }
    })
  }

  public async start() {
    return await new Promise<void>((resolve) => {
      this.app.listen(this.config.port, (token) => {
        this.listenSocket = token
        this.singletonServices.logger.info(
          `listening on port ${this.config.port}`
        )
        resolve()
      })
    })
  }

  public async stop(): Promise<void> {
    return await new Promise<void>((resolve) => {
      if (this.listenSocket == null) {
        throw 'Unable to stop server as it hasn`t been correctly started'
      }
      uWS.us_listen_socket_close(this.listenSocket)
      this.listenSocket = null

      // Wait for 2 seconds to allow all connections to close
      setTimeout(resolve, 2000)
    })
  }

  public async enableExitOnSigInt() {
    process.removeAllListeners('SIGINT').on('SIGINT', async () => {
      this.singletonServices.logger.info('Stopping server...')
      await this.stop()
      this.singletonServices.logger.info('Server stopped')
      process.exit(0)
    })
  }
}
