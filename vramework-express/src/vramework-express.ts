import express, { NextFunction, Request, Response } from 'express'
import { Server } from 'http'
import { json, text } from 'body-parser'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import { UnauthorizedError } from 'express-jwt'
import cors from 'cors'
import getRawBody from 'raw-body'
import contentType from 'content-type'
const { ExpressAuth }  = require("@auth/express")
import { getSession } from "@auth/express"

import { getErrorResponse, MissingSessionError } from '@vramework/core/src/errors'
import { CoreAPIRoutes } from '@vramework/core/src/routes'
import { CoreConfig } from '@vramework/core/src/config'
import { CoreSingletonServices } from '@vramework/core/src/services'
import { loadSchema, validateJson } from '@vramework/core/src/schema'
import { CoreUserSession } from '@vramework/core/src/user-session'
import { verifyPermissions } from '@vramework/core/src/permissions'
import { mkdir, writeFile } from 'fs/promises'
import { v4 as uuid } from 'uuid'

export class VrameworkExpress {
  public app = express()
  private server: Server | undefined

  constructor(
    private readonly config: CoreConfig,
    private readonly services: CoreSingletonServices,
    private readonly routes: CoreAPIRoutes,
    private readonly expressAuthConfig: any
  ) {
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.init({
    //     dsn: 'https://c37538eaef80134982f69f41e5a5cbcf@o4505800221523968.ingest.sentry.io/4505807211397120',
    //     integrations: [
    //       Sentry.httpIntegration({
    //       }),
    //       Sentry.expressIntegration({

    //       }),
    //       new ProfilingIntegration(),
    //     ],
    //     tracesSampleRate: 0.25,
    //     profilesSampleRate: 0.25,
    //   });
    //   Sentry.setupExpressErrorHandler(this.app)
    // }
  }

  public async init() {
    this.app.use(
      cors({
        origin: /http:\/\/localhost:\d\d\d\d/,
        credentials: true,
      }),
    )

    this.app.use(
      json({
        limit: '1mb',
        type: 'application/json'
      }),
    )

    this.app.use(
      text({
        limit: '1mb',
        type: 'text/xml'
      }),
    )
    this.app.use(bodyParser.urlencoded({ extended: true }))

    this.app.use(cookieParser())

    this.app.use('/assets/', express.static(this.config.content.localFileUploadPath))

    this.app.get('/api/v1/health-check', function (req, res) {
      res.status(200).end()
    })

    const expressAuthConfig = this.expressAuthConfig
    this.app.use("/api/v1/auth/*", ExpressAuth(expressAuthConfig))
    this.app.use(async (req, res, next) => {
      const session: any = await getSession(req, expressAuthConfig)
      session.userId = session?.user?.id
      res.locals.session = session
      next()
    })


    const authMiddleware = (credentialsRequired: boolean) => async (req: Request, res: Response, next: NextFunction) => {
      const session = res.locals.session ?? (await getSession(req, this.expressAuthConfig))
      if (!session?.user && credentialsRequired) {
        next(new MissingSessionError())
      } else {
        next()
      }
    }

    this.app.get(
      '/api/v1/stream/:topic',
      authMiddleware(true),
      async (req, res) => {
        const session = (req as any).auth as CoreUserSession | undefined
        const sessionServices = await this.services.createSessionServices(this.services, { headers: req.headers, body: req.body, params: req.params }, session)
        req.on('close', async () => {
          for (const service of Object.values(sessionServices)) {
            if (service.closeSession) {
              await service.closeSession()
            }
          }
        })

        const headers = {
          'Content-Type': 'text/event-stream',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache'
        }
        res.writeHead(200, headers)

        this.services.streamService.addClient(res, req.params.topic)
      })

    this.app.put(`/api/v1/reaper/*`,
      authMiddleware(true),
      async (req, res) => {
        const file = await getRawBody(req, {
          length: req.headers['content-length'],
          limit: '100mb',
          encoding: contentType.parse(req).parameters.charset,
        })

        const key = req.path.replace('/api/v1/reaper/', '')
        const parts = key.split('/')
        const fileName = parts.pop()
        const dir = `${this.config.content.localFileUploadPath}/${parts.join('/')}`

        await mkdir(dir, { recursive: true })
        await writeFile(`${dir}/${fileName}`, file, 'binary')
        res.end()
      },
    )

    this.routes.forEach((route) => {
      if (route.schema) {
        loadSchema(route.schema, this.services.logger)
      }

      const path = `/api/${route.route}`
      this.services.logger.debug(`Adding ${route.type.toUpperCase()} with route ${path}`)

      this.app[route.type](
        path,
        authMiddleware(route.requiresSession !== false),
        async (req, res, next) => {
          try {
            res.locals.processed = true

            const isXML = req.headers['content-type']?.includes('text/xml')

            let data: any
            if (isXML) {
              data = req.body
            } else {
              data = { ...req.params, ...req.query, ...req.body }
              if (route.schema) {
                validateJson(route.schema, data)
              }
            }

            const session: CoreUserSession = res.locals.session
            const sessionServices = await this.services.createSessionServices(this.services, { headers: req.headers, body: req.body, params: req.params }, session)
            try {
              if (route.permissions) {
                await verifyPermissions(route.permissions, sessionServices, data, session)
              }
              res.locals.result = await route.func(sessionServices, data, session)
            } catch (e: any) {
              console.error(e)
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
      console.log(error)

      if (!error) {
        return next()
      }

      if (error instanceof UnauthorizedError) {
        this.services.logger.error('JWT AUTH ERROR', error)
        res.status(401).end()
        return
      }

      const errorDetails = getErrorResponse(error)

      if (errorDetails != null) {
        const errorId = (error as any).errorId || uuid()
        console.error(error)
        this.services.logger.error({ errorId, error })
        res.status(errorDetails.status).json({ message: errorDetails.message, errorId, payload: (error as any).payload })
        return
      }

      const errorId = uuid()
      this.services.logger.error({ errorId, error })
      res.status(500).json({ errorId })
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
      this.server = this.app.listen(this.config.server.port, () => {
        this.services.logger.info(`listening on port ${this.config.server.port}`)
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
}
