#!/usr/bin/env ts-node
require('ts-node').register({
  transpileOnly: true,
})

import { Command } from 'commander'
import { schemas } from './vramework-schemas'
import { routes } from './vramework-routes'

const program = new Command('vramework')
program.usage('[command]')

schemas(program)
routes(program)

program.parse(process.argv)
