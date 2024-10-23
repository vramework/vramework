import Fastify from 'fastify'

import {
  CoreServerConfig,
  CoreSingletonServices,
  CreateSessionServices,
  VrameworkConfig,
} from '@vramework/core/types/core.types'
import { runRoute } from '@vramework/core/route-runner'
import { initializeVrameworkCore } from '@vramework/core/initialize'

import { VrameworkFastifyRequest } from './vramework-fastify-request.js'
import { VrameworkFastifyResponse } from './vramework-fastify-response.js'

export class VrameworkFastifyServer {
  public app = Fastify({})

  constructor(
    private readonly vrameworkConfig: VrameworkConfig,
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
    await initializeVrameworkCore(
      this.singletonServices.logger,
      this.vrameworkConfig
    )

    this.app.get(this.config.healthCheckPath || '/health-check', async () => {
      return { status: 'ok' }
    })

    this.app.all('/*', async (req, res) => {
      try {
        await runRoute(
          new VrameworkFastifyRequest(req),
          new VrameworkFastifyResponse(res),
          this.singletonServices,
          this.createSessionServices,
          {
            method: req.method as any,
            route: req.url as string,
          }
        )
      } catch {
        // Error should have already been handled by runRoute
      }

      if (!res.sent) {
        this.singletonServices.logger.error('Route did not send a response')
        res.status(500)
      }
    })
  }

  public async start() {
    await this.app.listen({ port: this.config.port, host: this.config.hostname })
    this.singletonServices.logger.info(`listening on port ${this.config.port} and host: ${this.config.hostname}`)
  }

  public async stop(): Promise<void> {
    this.singletonServices.logger.info('Stopping server...')
    await this.app.close()
    this.singletonServices.logger.info('Server stopped')
  }

  public async enableExitOnSigInt() {
    process.removeAllListeners('SIGINT').on('SIGINT', async () => {
      await this.stop()
      process.exit(0)
    })
  }
}
