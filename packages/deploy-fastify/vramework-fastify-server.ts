import Fastify from 'fastify'

import {
  CoreConfig,
  CoreSingletonServices,
  CreateSessionServices,
  VrameworkConfig,
} from '@vramework/core/types'
import { runRoute } from '@vramework/core/route-runner'
import { VrameworkFastifyRequest } from './vramework-fastify-request'
import { VrameworkFastifyResponse } from './vramework-fastify-response'
import { initializeVrameworkCore } from '@vramework/core/initialize'

export class VrameworkFastifyServer {
  public app = Fastify({})

  constructor(
    private readonly vrameworkConfig: VrameworkConfig,
    private readonly config: CoreConfig,
    private readonly singletonServices: CoreSingletonServices,
    private readonly createSessionServices: CreateSessionServices
  ) { }

  /**
   * Placeholder for enabling CORS
   */
  public enableCors(_options: any) {
    throw new Error('Method not implemented.')
  }

  public async init() {
    await initializeVrameworkCore(this.singletonServices.logger, this.vrameworkConfig)

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
    await this.app.listen({ port: this.config.port })
    this.singletonServices.logger.info(`listening on port ${this.config.port}`)
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
