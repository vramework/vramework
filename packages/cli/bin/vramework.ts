#!/usr/bin/env node
require('ts-node').register({
  transpileOnly: true,
})

import { Command } from 'commander'
import { schemas } from './vramework-schemas'
import { routes } from './vramework-routes'
import { nextjs } from './vramework-nextjs'

const program = new Command('vramework')
program.usage('[command]')

schemas(program)
routes(program)
nextjs(program)

program.parse(process.argv)
