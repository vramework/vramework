import express, { NextFunction, Request, Response } from 'express'
import { Server } from 'http'
import { json, text } from 'body-parser'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import getRawBody from 'raw-body'
import contentType from 'content-type'
import cors, { CorsOptions, CorsOptionsDelegate } from 'cors'

import { mkdir, writeFile } from 'fs/promises'

import { CoreConfig, CoreSingletonServices, CreateSessionServices, LocalContentConfig, SessionService, VrameworkConfig } from '@vramework/core/types'
import { MissingSessionError } from '@vramework/core/errors'
import { loadSchema } from '@vramework/core/schema'
import { initializeVrameworkCore } from '@vramework/core/initialize'
import { VrameworkExpressRequest } from './vramework-express-request'
import { VrameworkExpressResponse } from './vramework-express-response'
import { runRoute } from '@vramework/core/router-runner'

const autMiddleware = (credentialsRequired: boolean, sessionService?: SessionService) => (req: Request, res: Response, next: NextFunction) => {
  if (!sessionService) {
    if (credentialsRequired) {
      throw new Error('Session service required for authentication')
    }
    next()
    return
  }

  sessionService.getUserSession(
    credentialsRequired, 
    new VrameworkExpressRequest(req)
  ).then((session) => {
    (req as any).auth = session
    next()
  }).catch((e) => {
    if (credentialsRequired) {
      next(new MissingSessionError())
    } else {
      next()
    }
  })
}

const contentHandler = (app: VrameworkExpressServer["app"], config: LocalContentConfig, sessionService?: SessionService) => {
  const reaperUrl = config.uploadUrl || `/v1/reaper/*`

  app.use(config.assetsUrl || '/assets/', express.static(config.contentDirectory))
  app.put(reaperUrl,
    autMiddleware(true, sessionService),
    async (req, res) => {
      const file = await getRawBody(req, {
        length: req.headers['content-length'],
        limit: config.fileUploadLimit || '1mb',
        encoding: contentType.parse(req).parameters.charset,
      })
      const key = req.path.replace(reaperUrl, '')
      const parts = key.split('/')
      const fileName = parts.pop()
      const dir = `${config.contentDirectory}/${parts.join('/')}`
      await mkdir(dir, { recursive: true })
      await writeFile(`${dir}/${fileName}`, file, 'binary')
      res.end()
    },
  )
}

export class VrameworkExpressServer {
  public app = express()
  private server: Server | undefined

  constructor(
    private readonly vrameworkConfig: VrameworkConfig,
    private readonly config: CoreConfig,
    private readonly singletonServices: CoreSingletonServices,
    private readonly createSessionServices: CreateSessionServices,
  ) {}

  public enableCors (options: CorsOptions | CorsOptionsDelegate) {
    this.app.use(cors(options))
  }

  public async init() {
    const { routes } = await initializeVrameworkCore(this.vrameworkConfig)
    
    // Verify all schemas are loaded
    routes.forEach((route) => {
      if (route.schema) {
        loadSchema(route.schema, this.singletonServices.logger)
      }
    })

    this.app.use(
      json({
        limit: this.config.limits?.json || '1mb',
      }),
    )

    this.app.use(
      text({
        limit: this.config.limits?.xml || '1mb',
        type: 'text/xml'
      }),
    )

    this.app.use(
      bodyParser.urlencoded({ 
        extended: true,
        limit: this.config.limits?.urlencoded || '1mb' 
    }))

    this.app.use(cookieParser())

    this.app.get(this.config.healthCheckPath || 'health-check', function (req, res) {
      res.status(200).end()
    })

    if (this.config.content?.local) {
      contentHandler(this.app, this.config.content.local, this.singletonServices.sessionService)
    }

    this.app.use(async (req, res) => {
      try {
        await runRoute(
          new VrameworkExpressRequest(req),
          new VrameworkExpressResponse(res),
          this.singletonServices,
          this.createSessionServices,
          routes,
          {
            type: req.method.toLowerCase() as any,
            route: req.path,
          }
        )
      } catch (e) {
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
        this.singletonServices.logger.info(`listening on port ${this.config.port}`)
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

  public async enableExitOnSigInt () {
    process.removeAllListeners('SIGINT').on('SIGINT', async () => {
      this.singletonServices.logger.info('Stopping server...')
      await this.stop()
      this.singletonServices.logger.info('Server stopped')
      process.exit(0)
    })
  }
}
