import * as uWS from 'uWebSockets.js'

import {
  CoreServerConfig,
  CoreSingletonServices,
  CreateSessionServices,
} from '@vramework/core/types/core.types'

import { vrameworkHandler } from '@vramework/uws-handler'

export class VrameworkUWSServer {
  public app = uWS.App()
  private listenSocket: boolean | uWS.us_listen_socket | null = null

  constructor(
    private readonly config: CoreServerConfig,
    private readonly singletonServices: CoreSingletonServices,
    private readonly createSessionServices: CreateSessionServices<any, any, any>
  ) {}

  /**
   * Placeholder for enabling CORS
   */
  public enableCors(_options: any) {
    throw new Error('Method not implemented.')
  }

  public async init() {
    this.app.get(
      this.config.healthCheckPath || '/health-check',
      async (res) => {
        res.writeStatus('200').end()
      }
    )

    this.app.any(
      '/*',
      vrameworkHandler({
        logRoutes: true,
        singletonServices: this.singletonServices,
        createSessionServices: this.createSessionServices,
      })
    )
  }

  public async start() {
    return await new Promise<void>((resolve) => {
      this.app.listen(this.config.hostname, this.config.port, (token) => {
        this.listenSocket = token
        this.singletonServices.logger.info(
          `listening on port ${this.config.port} and host: ${this.config.hostname}`
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
