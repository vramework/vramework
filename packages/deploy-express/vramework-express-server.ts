import express, { NextFunction, Request, Response } from 'express'
import { Server } from 'http'
import { json, text } from 'body-parser'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import { UnauthorizedError } from 'express-jwt'
import getRawBody from 'raw-body'
import contentType from 'content-type'
import cors, { CorsOptions, CorsOptionsDelegate } from 'cors'

import { mkdir, writeFile } from 'fs/promises'
import { v4 as uuid } from 'uuid'

import { CoreConfig, CoreSingletonServices, CoreUserSession, CreateSessionServices, LocalContentConfig, SessionService, VrameworkConfig } from '@vramework/core/types'
import { getErrorResponse, MissingSessionError } from '@vramework/core/errors'
import { loadSchema, validateJson } from '@vramework/core/schema'
import { initializeVrameworkCore } from '@vramework/core/initialize'
import { verifyPermissions } from '@vramework/core/permissions'
import { VrameworkExpressRequest } from './vramework-express-request'
import { VrameworkExpressResponse } from './vramework-express-response'

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

    routes.forEach((route) => {
      if (route.schema) {
        loadSchema(route.schema, this.singletonServices.logger)
      }

      const path = `/${route.route}`
      this.singletonServices.logger.debug(`Adding ${route.type.toUpperCase()} with route ${path}`)
      this.app[route.type](
        path,
        autMiddleware(route.requiresSession !== false, this.singletonServices.sessionService),
        async (req, res, next) => {
          try {
            res.locals.processed = true
            const session = (req as any).auth as CoreUserSession | undefined
            const isXML = req.headers['content-type']?.includes('text/xml')
            
            let data: any
            if (isXML) {
              if (route.contentType === 'xml') {
                data = req.body
              }
              throw new Error('Unsupported content type')
            } else {
              data = { ...req.params, ...req.query, ...req.body }
              if (route.schema) {
                validateJson(route.schema, data)
              }
            }

            const sessionServices = await this.createSessionServices(
              this.singletonServices, 
              session, 
              new VrameworkExpressRequest(req), 
              new VrameworkExpressResponse(res)
            )
            try {
              if (route.permissions) {
                await verifyPermissions(route.permissions, sessionServices, data, session)
              }
              res.locals.result = await route.func(sessionServices, data, session)
            } catch (e: any) {
              throw e
            } finally {
              for (const service of Object.values(sessionServices)) {
                if (service.closeSession) {
                  await service.closeSession()
                }
              }
            }
            next()
          } catch (e: any) {
            next(e)
          }
        },
      )
    })

    this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (!error) {
        return next()
      }

      if (error instanceof UnauthorizedError) {
        this.singletonServices.logger.error('JWT AUTH ERROR', error)
        res.status(401).end()
        return
      }

      const errorDetails = getErrorResponse(error)
      if (errorDetails != null) {
        const errorId = (error as any).errorId || uuid()
        console.error(errorId, error)
        res.status(errorDetails.status).json({ message: errorDetails.message, errorId, payload: (error as any).payload })
      } else {
        const errorId = uuid()
        console.error(errorId, error)
        res.status(500).json({ errorId })
      }
    })

    this.app.use((req, res) => {
      if (res.locals.processed !== true) {
        res.status(404).end()
        return
      }
      
      if (res.locals.result) {
        if (res.locals.returnsJSON === false) {
          res.send(res.locals.result).end()
        } else {
          res.json(res.locals.result).end()
        }
      } else {
        res.status(200).end()
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
