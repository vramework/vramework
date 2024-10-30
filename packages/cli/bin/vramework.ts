#!/usr/bin/env node
import { Command } from 'commander'
import { schemas } from './vramework-schemas.js'
import { routes } from './vramework-routes.js'
import { nextjs } from './vramework-nextjs.js'
import { all } from './vramework-all.js'
import { functionTypes } from './vramework-function-types.js'
import { routesMap } from './vramework-routes-map.js'
import { fetch } from './vramework-fetch.js'

const program = new Command('vramework')
program.usage('[command]')

all(program)
routes(program)
routesMap(program)
functionTypes(program)
schemas(program)
nextjs(program)
fetch(program)

program.parse(process.argv)
