#!/usr/bin/env node
require('ts-node').register({
  transpileOnly: true,
})

import { Command } from 'commander'
import { schemas } from './vramework-schemas.js'
import { routes } from './vramework-routes.js'
import { nextjs } from './vramework-nextjs.js'

const program = new Command('vramework')
program.usage('[command]')

schemas(program)
routes(program)
nextjs(program)

program.parse(process.argv)
