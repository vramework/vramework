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
