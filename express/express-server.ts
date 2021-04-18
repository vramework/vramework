/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express'
import { Server } from 'http'
import { json } from 'body-parser'
import cookieParser from 'cookie-parser'
import jwt from 'express-jwt'
import cors from 'cors'

import { getErrorResponse } from '@vramework/backend-common/src/errors'
import { CoreAPIRoutes } from '@vramework/backend-common/src/routes'
import { CoreConfig } from '@vramework/backend-common/src/config'
import { CoreServices, JWTService } from '@vramework/backend-common/src/services'
import { loadSchema, validateJson } from '@vramework/backend-common/src/schema'
import { CoreUserSession } from '@vramework/backend-common/src/user-session'

const jwtMiddleware = (credentialsRequired: boolean, jwtService: JWTService, cookieName: string) =>
  jwt({
    credentialsRequired,
    algorithms: ['HS256'],
    secret: (req, header, payload, done) => {
      jwtService.getJWTSecret(header, done as any)
    },
    getToken: (req) => {
      if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return req.headers.authorization.split(' ')[1]
      } else if (req.cookies[cookieName]) {
        return req.cookies[cookieName]
      }
      return null
    },
  })

export class ExpressServer {
  public app = express()
  private server: Server | undefined

  constructor(private config: CoreConfig, private services: CoreServices, private routes: CoreAPIRoutes) {}

  public async init() {
    this.app.use(
      json({
        limit: '1mb',
      }),
    )
    this.app.use(cookieParser())
    this.app.use(
      cors({
        origin: /http:\/\/localhost:\d\d\d\d/,
        credentials: true,
      }),
    )

    this.app.get('/api/health-check', function (req, res) {
      res.status(200).end()
    })

    // this.app.get(`/${Routes.USER_LOGOUT}`, (req, res) => {
    //   res.clearCookie(this.config.cookie.name)
    //   res.end()
    // })

    this.routes.forEach((route) => {
      if (route.schema) {
        loadSchema(route.schema, this.services.logger)
      }

      const path = `/${route.route}`
      this.services.logger.info(`Adding ${route.type.toUpperCase()} with route ${path}`)
      this.app[route.type](
        path,
        jwtMiddleware(false, this.services!.jwt, this.config.cookie.name),
        async (req, res, next) => {
          try {
            const session = (req as any).user as CoreUserSession | undefined

            res.locals.cookiename = this.config.cookie.name
            res.locals.processed = true
            let result

            const data = {...req.params, ...req.query, ...req.body }
            
            if (route.schema) {
              validateJson(route.schema, data)
            }

            const permissionValid = this.services.permissions.validate(this.config, this.services as any, route, data, session as any)
            if (!permissionValid) {
              // Invalid Permissions
            }

            result = result = await route.func(this.services!, {
              config: this.config,
              data,
              session: (req as any).user,
            })
            res.locals.result = result
            next()
          } catch (e) {
            next(e)
          }
        },
      )
    })

    this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (!error) {
        return next()
      }

      if (error instanceof jwt.UnauthorizedError) {
        this.services.logger.error('JWT AUTH ERROR', error)
        res.status(401).end()
        return
      }

      const errorDetails = getErrorResponse(error.constructor)
      if (errorDetails) {
        res.status(errorDetails.status).json({ message: errorDetails.message })
      } else {
        console.error(error)
      }
    })

    this.app.use((req, res) => {
      if (res.locals.processed !== true) {
        res.status(404).end()
        return
      }
      if (res.locals.result) {
        if (res.locals.result.jwt) {
          res.cookie(res.locals.cookiename, res.locals.result.jwt, {
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: true,
            // domain: this.config.cookie.domain,
          })
        }
        res.json(res.locals.result).end()
      } else {
        res.status(200).end()
      }
    })
  }

  public async start() {
    return new Promise<void>((resolve) => {
      this.server = this.app.listen(this.config.server.port, () => {
        this.services.logger.info(`listening on port ${this.config.server.port}`)
        resolve()
      })
    })
  }

  public async stop(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!this.server) {
        throw 'Unable to stop server as it hasn`t been correctly started'
      }
      this.server.close(() => {
        resolve()
      })
    })
  }
}

