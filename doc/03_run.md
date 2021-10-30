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
