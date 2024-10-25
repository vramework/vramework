import * as expressImp from 'express'
const express = 'default' in expressImp ? (expressImp.default as any) : expressImp
import * as core from 'express-serve-static-core'
import { Server } from 'http'
import { json, text } from 'body-parser'
import * as cookieParserImp from 'cookie-parser'
const cookieParser = 'default' in cookieParserImp ? (cookieParserImp.default as any) : cookieParserImp
import * as bodyParser from 'body-parser'
import * as corsImp from 'cors'
const cors = 'default' in corsImp ? (corsImp.default as any) : corsImp
import { CorsOptions, CorsOptionsDelegate } from 'cors'

import {
  CoreSingletonServices,
  CreateSessionServices,
  CoreServerConfig,
} from '@vramework/core/types/core.types'
import { initializeVrameworkCore } from '@vramework/core/initialize'
import { vrameworkMiddleware } from '@vramework/express-middleware'

export class VrameworkExpressServer {
  public app: core.Express = express()
  private server: Server | undefined

  constructor(
    // private readonly vrameworkConfig: VrameworkConfig,
    private readonly config: CoreServerConfig,
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
      this.config.healthCheckPath || '/health-check',
      function (req, res) {
        res.status(200).json({ status: 'ok' })
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
    await initializeVrameworkCore(this.singletonServices.logger)

    this.app.use(vrameworkMiddleware(this.singletonServices, this.createSessionServices, {
      set404Status: false,
    }))
  }

  public async start() {
    return await new Promise<void>((resolve) => {
      this.server = this.app.listen(this.config.port, this.config.hostname, () => {
        this.singletonServices.logger.info(`listening on port ${this.config.port} and host: ${this.config.hostname}`)
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
