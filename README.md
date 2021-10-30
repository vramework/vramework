---
title: Design
description: Design Patterns
---

### HTTP Agnostic

So the concept of making things HTTP agnostic is pretty simple at its core.

A JSON HTTP request (usually) comes in with the following format:

```yaml
type: post | patch | delete | get | head
route: /v1/object/:objectId
pathParams:
  objectId: string
queryParams:
  queryOne: string | string[]
  ...
body: json
```

What we do in vramework is squash all the datapoints together:

```typescript
const data = { ...req.query, ...req.body, ...req.path }
```

This now means we no longer need to care where the data exists, as long as we are okay with the order of overrides.

The two ways you can respond to the request is either by throwing an Error or reaching the end of the async function.

Let's take an example:

```typescript
import { addErrors, EError } from '@vramework/backend-common/src/errors'

interface Book {
    id: string,
    title: string
}

class BookNotFoundError extends EError {
    // This payload will be forwarded to the client if set
    public payload: Record<string, any> = {}

    constructor (bookId: string) {
        this.payload = { bookId }
    }
}
addErrors([BookNotFoundError,  { status: 404, message: 'error.book_not_found' }])

const getBook: APIFunction<Pick<Book, 'id'>, Book> = (services, data, session) => {
  // This database driver is what we use, but you can use mongo or anything else
  const book = await services.database.get('book', [], data)
  if (!book) {
      throw new BookNotFoundError(data.id)
  }
  return book
}
```

That's pretty much it. Defined errors return the status, message and payload. Ones that are not
defined throw a 500 status.

### Framework Agnostic

Framework agnostic just means you aren't using any specific functionality by any framework.

Vramework.io currently supports AWS-Lambda via serverless and Express. In theory, there's nothing to stop us from writing
more thing wrappers using the same typings for other frameworks, but since it's not used in my daily job I don't see the benefit.

The biggest plus from not being tied into anything specific combined with our dependency injection means we can easily switch out remote services (like S3, Incognito, Mandrill, etc) with local ones. This is really useful
as it avoids the requirement to create development accounts for every user on cloud platforms.

### Typescript Everywhere

I just love typescript. Everything in the vramework is currently strongly typed.

The current workflow I use is:

1) Use [schemats](https://github.com/vramework/schemats) to describe the Postgres DB so we get all the types.
2) Use those types directly in functions to validate all my (crud) SQL queries
3) Mix and match those types using `Pick` and `Omit` to generate types that the APIs return
4) Use those returned types in the frontend
5) Change a field name or type in the DB and watch everything go red!
6) Bonus: Derive enums from Postgres to populate select boxes and so forth in the frontend

### Routes combiner and JSON Schema file generation

So this part I'm always a bit torn about, as I don't like autogenerated files.

We have three scripts we tend to use:

1) generate routes

    This generates an index file that combines all the routes. This is important for serverless deploys as we can't load them dynamically on start or else they wouldn't be bundled. The plus side is it also validates no routes are conflicting. It knows a file has a route when it exports a routes
    property.

2) generateSchemas

    This generates all the schemas defined in the routes. If one is missing / has a typo it complains so we are aware of it. There's nothing to stop you from checking in the schemas to look at the diffs, but it's 
    recommended running this as part of your build.

3) schemats

    This is not something you have to use, but it spits out all the types from Postgres which we then use
    in the rest of our codebase. 
---
title: Code
description: Code Concepts
---

## Dependency Injection

Let's take a look at how our services are set up.

### The interfaces

```typescript
// The Session Service is required to get the user session out of the request. It currently
// expects either an APIKey, Authorization Header or Cookie.
export interface SessionService<UserSession = CoreUserSession> {
  getUserSession: (credentialsRequired: boolean, headers: Partial<Record<'cookie' | 'authorization' | 'apiKey', string | undefined>>, debug?: any) => Promise<UserSession | undefined>
  getCookieName: (headers: Record<string, string>) => string
}

// These are the singleton services vramework needs to work and are long lived / shared across
// all function invocations
export interface CoreSingletonServices {
  // This provides the config
  config: CoreConfig
  // This is a logger (with error/info/warn APIs)
  logger: PinoLogger
  // The session service as shown above
  sessionService: SessionService
  // The factory for unique services that live only for the duration of an API call
  createSessionServices: (services: CoreSingletonServices, headers: Record<string, any>, session?: CoreUserSession) => CoreServices
}

// These are services that are created for specific API calls. They tend to be lazy, meaning
// they initialize once used instead of by default.
// Examples are:
// - header service: This is a service that just exposes the header via a cleaner API
// - database service: This returns a lazy-loaded transaction so that everything in the function
// runs within one. If you don't need a transaction you can just use the database pool on the 
// singleton sessions which can point to read replicas
export interface CoreServices extends CoreSingletonServices {
}
```

### The implementation

```typescript
export const setupServices = async (config: Config): Promise<Services> => {
    console.time('Services Setup')

    const slack = new Slack(config)
    // The reason we have a class instead of using pino directly 
    // is because whenever an error happens we send a slack notification
    const logger = new PinoLogger(slack)

    try {
      const secrets: SecretSerice = inProductionEnv ? new AWSSecrets(config, logger) : new LocalSecrets(config, logger)
      const promises: Array<Promise<void>> = []

      const databasePool = new PGDatabasePool(await secrets.getDatabaseCredentials(), logger)
      await databasePool.init()

      const jwt = new JWTManager(async () => await databasePool.query(`SELECT * from jwt_secrets`), logger)
      promises.push(jwt.init())
      const sessionService = new VrameworkSessionService(jwt, () => { throw new Error('API Keys not supported') })

      const files: FilesService = inProductionEnv ? new S3Files(config, logger) : new LocalFiles(config, logger)
      promises.push(files.init(secrets))

      await Promise.all(promises)
      console.timeEnd('Services Setup')

      const services = { config, logger, secrets, databasePool,jwt, files, sessionService }
    
      const createSessionServices = async (services: SingletonServices, headers: Record<string, any>, session: UserSession): Promise<Services> => {
        return {
          ...(services as any),
          headers: new HeadersService(headers),
          database: new PGDatabaseClient(services.databasePool, services.logger, session?.userId)
        }
      }
  
      return { ...services, createSessionServices } as never as Services // 🙈
    } catch (error) {
      console.error(error)
      logger.error(`Error setting up services`, { error: error.message })
      throw new Error(`Error setting up services`)
    }
  }
  ```

And now whenever a function is called, those services will be passed in!

## User Sessions

User sessions are dealt with by indicating if the API call requires a session or not. The default is always that it does.

```typescript
export const routes: APIRoutes = [{
  type: 'post',
  route: 'v1/send-greeting-card',
  func: sendGreetingCard,
  schema: 'SendGreedingCard',
  // Session
  requiresSession: true
}]
```

Regardless if a session is required or not, vramework will try and find a session for each API call. This is useful
for APIs open to the public as well as registered users.

To define the session, you need to create your UserSession type:

```typescript
// Vramework only needs this
export interface CoreUserSession {
  userId: string
}

// But you can add more things to it
export type UserSession = CoreUserSession & {
  userId: string
  role: DB.Role
  permissions?: {
    canDoSomethingAwesome: boolean
  }
}
```

And the session will always be provided in the third argument of the APIFunction (assuming it's there).

For making life a little easier, you have to different APIFunctions:

```typescript
// This means a session is always required and hence never null
export type APIFunction<In, Out> = (services: Services, data: In, session: UserSession) => Promise<Out>
// This can be null, so needs to be guarded against when accessing
export type APIFunctionSessionless<In, Out> = (services: Services, data: In, session?: UserSession) => Promise<Out>
```

## API Permissions

Permissions in vramework are done on the routeing layer. You can in theory also do it within the functions themselves, I just
find it more convenient to do those checks outside since they tend to be quite repetitive.

So in our use cases, we have multiple different actor types (Admin, Consultant, User). Each one can get access to certain APIs
based on their role OR permissions OR both. Hence we have this greedy mechanism to try doing that:

```typescript
// The type
export type APIPermission<In = any> = (services: Services, data: In, session: UserSession) => Promise<boolean>

const canDoSomethingAwesome: APIPermission<SendGreedingCard> = (services, data, session) => {
  return session.permission.canDoSomethingAwesome === true
}

const hasSpecialOverride: APIPermission<SendGreedingCard> = (services, data, session) => {
  return services.headers.hasSpecialAPIKeyForThisAwesomeFeature()
}

export const routes: APIRoutes = [{
  type: 'post',
  route: 'v1/send-greeting-card',
  func: sendGreetingCard,
  schema: 'SendGreedingCard',
  // Session
  requiresSession: true,
  permissions: [{
    admin: isAdmin,
    anyoneElse: [canDoSomethingAwesome, hasSpecialOverride]
  }]
}]
```
---
title: Running
description: Running vramework
---

## Express

We are a massive fan of [commander](https://github.com/tj/commander.js#readme) and so tend to use it to start.

There are two files:

### The main file

```typescript
#!/usr/bin/env node
import pkg = require('../package.json') 

import { Command } from 'commander'
import { start } from './express-start'

const program = new Command('express')
program.usage('[command]').version(pkg.version.toString())

start(program)

program.parse(process.argv)
```

### The file that starts the server

```typescript

import commander from 'commander'
import { ExpressServer } from '@vramework/deploy-express/dist/express-server'

import { config } from '@myproject/functions/src/config'
import { setupServices } from '@myproject/functions/src/services'
import { getRoutes } from '@myproject/functions/src/routes'

// work-around for:
// TS4023: Exported variable 'command' has or is using name 'local.Command'
// from external module "node_modules/commander/typings/index" but cannot be named.
export type Command = commander.Command

async function action(): Promise<void> {
  try {
    const services = await setupServices(config)
    const routes = getRoutes()

    const appServer = new ExpressServer(config, services, routes as any)
    appServer.init().then(async () => await appServer.start())
    process.removeAllListeners('SIGINT').on('SIGINT', () => {
      appServer.stop()
    })
  } catch (err) {
    console.error(err.toString())
    process.exit(1)
  }
}

export const start = (program: Command): void => {
  program.command('start').description('start the express server').action(action)
}
```

And that's pretty much it. The services code and config are shared between serverless and express so 
no other changes are needed.

## Serverless

Serverless is a little bit harder due to the way it bundles things for deployment

**Important: in yarn workspaces, all dependencies need to be mentioned in the serverless package file**

This file is the serverless entry point:

```typescript
import { APIGatewayProxyEvent } from 'aws-lambda'

import { processCors, processCorsless } from '@vramework/deploy-lambda/lambda'

import { config } from '@myproject/functions/src/config'
import { setupServices } from '@myproject/functions/src/services'
import { getRoutes } from '@myproject/functions/src/routes'

const services = setupServices(config)
const routes = getRoutes()

export const corslessHandler = async (event: APIGatewayProxyEvent) => {
  return await processCorsless(event, routes as any, config, await services)
}

export const corsHandler = async (event: APIGatewayProxyEvent) => {
  return await processCors(event, routes as any, config, await services)
}
```

This file is the whats used to generate a webpack bundle for serverless:

```javascript
const path = require('path');
const nodeExternals = require('webpack-node-externals')

module.exports = {
  mode: 'production',
  entry: ['./serverless.ts'],
  externals: [nodeExternals({
    allowlist: package => package.includes('@myproject') || package.includes('@vramework')
  })],
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      'pg-native': path.join(__dirname, 'aliases/pg-native.js')
    }
  },
  output: {
    libraryTarget: 'commonjs',
    path: __dirname,
    filename: 'index.js'
  },
  target: 'node',
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: require.resolve('ts-loader')
      }
    ]
  }
};
```

And this (subset of) file does the entire deployment. It's pretty specific to our use case but it provides the gist.

```YAML
# serverless.yml
service: api

provider:
  name: aws
  runtime: nodejs14.x
  stage: ${opt:stage}
  region: us-east-1
  lambdaHashingVersion: 20201221
  timeout: 10
  apiGateway:
    shouldStartNameWithService: true
  environment:
    # This is used for cors validation.
    DOMAIN: "${env:DOMAIN}"

custom:
  customDomain:
    domainName: "api.${env:DOMAIN}"
    certificateName: "*.${env:DOMAIN}"
    endpointType: regional
    securityPolicy: tls_1_2
    apiType: rest

functions:
  # This is mostly for webhooks 
  corsless:
    timeout: 30
    handler: index.corslessHandler
    events:
      - http:
          path: /v1/facebook/{proxy+}
          method: options
      - http:
          path: /v1/facebook/{proxy+}
          method: any

  # This is for application logic. The reason we don't handle cors on serverless is 
  # because we have multiple different domains that use it and hence we deal with cors
  # within serverless. However, you can enable cors on lambda and just take out options
  # if needed. You can provide a list of cors enabled domains in the config handler.
  cors:
    handler: index.corsHandler
    events:
      - http:
          path: /v1/{proxy+}
          method: options
      - http:
          path: /v1/{proxy+}
          method: any
```

## Binary

The last thing we can do is package up express into a binary. I didn't need to do that yet,
but it would mostly just be nexe on top of express and if there's enough demand for it can be done relatively easy.
---
title: FAQ
description: Questions about vramework
---

### How can I try it out?

I set up an [example repo](https://github.com/vramework/vramework-example) which will hopefully be updated in the upcoming weeks with a fully working example.

### Where are the tests at?

Great question. Since vramework is a pretty lightweight wrapper around express and serverless the tests we do are mostly in the proprietary layer, mostly done via E2E frameworks. It's not in the best interest of an OS project, but open-sourcing this, in general, was more to share
a solution I came up with rather than have heavy marketing or promotions. Hopefully, if it makes sense these things will be added by other
core maintainers, hence the MIT license.

### What's the risk of being hooked in?

None. If you decide you want to just go with express u can just go back to using express and their middleware. You don't have to use one or the other.
