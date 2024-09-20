import express from 'express'
import { Server } from 'http'
import { json, text } from 'body-parser'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import cors, { CorsOptions, CorsOptionsDelegate } from 'cors'
import busboy from 'busboy'

import * as path from 'path'
import { createWriteStream } from 'fs'
import * as fs from 'fs/promises'

import {
  CoreConfig,
  CoreSingletonServices,
  CreateSessionServices,
  VrameworkConfig,
} from '@vramework/core/types'
import { loadSchema } from '@vramework/core/schema'
import { initializeVrameworkCore } from '@vramework/core/initialize'
import { VrameworkExpressRequest } from './vramework-express-request'
import { VrameworkExpressResponse } from './vramework-express-response'
import { runRoute } from '@vramework/core/router-runner'
import { VrameworkRequest } from '@vramework/core/vramework-request'

export class VrameworkExpressServer {
  public app = express()
  private server: Server | undefined

  constructor(
    private readonly vrameworkConfig: VrameworkConfig,
    private readonly config: CoreConfig,
    private readonly singletonServices: CoreSingletonServices,
    private readonly createSessionServices: CreateSessionServices
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

  public enableFileUploads(uploadDir: string, uploadUrl: string, validateUploadSignature: (request: VrameworkRequest) => Promise<boolean>) {
    this.app.put(
      uploadUrl,
      async (req, res) => {
        const request = new VrameworkExpressRequest(req)

        const isValid = await validateUploadSignature(request)
        if (!isValid) {
          res.status(403).end()
          return
        }
        
        const contentType = request.getHeader('content-type')
        const key = req.path.replace(uploadUrl, '')
        const parts = key.split('/')
        const dir = `${uploadDir}/${parts.join('/')}`
        await fs.mkdir(dir, { recursive: true })

        if (contentType === 'multipart/form-data') {
          const bb = busboy({ headers: req.headers })
          bb.on('file', (_name, file, _info) => {
            file.pipe(createWriteStream(path.join(uploadDir, key)))
          })
          bb.on('close', () => {
            res.writeHead(200, { 'Connection': 'close' });
            res.end()
          })
          req.pipe(bb)
        } else {
          this.singletonServices.logger.info('Only multipart/form-data uploads supported')
          throw new Error()
        }
      }
    )
  }

  public enableStaticAssets(assetsUrl: string, contentDirectory: string) {
    this.app.use(assetsUrl || '/assets/', express.static(contentDirectory))
  }

  public async init() {
    const { routes } = await initializeVrameworkCore(
      this.singletonServices.logger,
      this.vrameworkConfig
    )

    // Verify all schemas are loaded
    routes.forEach((route) => {
      if (route.schema) {
        loadSchema(route.schema, this.singletonServices.logger)
      }
    })

    this.app.use(async (req, res) => {
      try {
        await runRoute(
          new VrameworkExpressRequest(req),
          new VrameworkExpressResponse(res),
          this.singletonServices,
          this.createSessionServices,
          routes,
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
