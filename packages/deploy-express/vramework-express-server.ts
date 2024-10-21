import express from 'express'
import core from 'express-serve-static-core'
import { Server } from 'http'
import { json, text } from 'body-parser'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import cors, { CorsOptions, CorsOptionsDelegate } from 'cors'

import { VrameworkExpressRequest } from './vramework-express-request'
import { VrameworkExpressResponse } from './vramework-express-response'
import {
  VrameworkCLIConfig,
  CoreConfig,
  CoreSingletonServices,
  CreateSessionServices,
} from '@vramework/core/types/core.types'
import { initializeVrameworkCore } from '@vramework/core/initialize'
import { runRoute } from '@vramework/core/route-runner'

export class VrameworkExpressServer {
  public app: core.Express = express()
  private server: Server | undefined

  constructor(
    private readonly vrameworkConfig: VrameworkCLIConfig,
    private readonly config: CoreConfig,
    private readonly singletonServices: CoreSingletonServices,
    private readonly createSessionServices: CreateSessionServices<any, any, any>
  ) {
    this.app.use(
      json({
        limit: this.config.limits?.json || '1mb',
      })
    )

    this.app.use(
      text({
        limit: this.config.limits?.xml || '1mb',
        type: 'text/xml',
      })
    )

    this.app.use(
      bodyParser.urlencoded({
        extended: true,
        limit: this.config.limits?.urlencoded || '1mb',
      })
    )

    this.app.use(cookieParser())

    this.app.get(
      this.config.healthCheckPath || 'health-check',
      function (req, res) {
        res.status(200).end()
      }
    )
  }

  public enableCors(options: CorsOptions | CorsOptionsDelegate) {
    this.app.use(cors(options))
  }

  public enableStaticAssets(assetsUrl: string, contentDirectory: string) {
    this.app.use(assetsUrl || '/assets/', express.static(contentDirectory))
  }

  public async init() {
    await initializeVrameworkCore(
      this.singletonServices.logger,
      this.vrameworkConfig
    )

    this.app.use(async (req, res) => {
      try {
        await runRoute(
          new VrameworkExpressRequest(req),
          new VrameworkExpressResponse(res),
          this.singletonServices,
          this.createSessionServices,
          {
            method: req.method.toLowerCase() as any,
            route: req.path,
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
      this.server = this.app.listen(this.config.port, () => {
        this.singletonServices.logger.info(
          `listening on port ${this.config.port}`
        )
        resolve()
      })
    })
  }

  public async stop(): Promise<void> {
    return await new Promise<void>((resolve) => {
      if (this.server == null) {
        throw 'Unable to stop server as it hasn`t been correctly started'
      }
      this.server.close(() => {
        resolve()
      })
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
