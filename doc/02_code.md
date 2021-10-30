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
