#!/usr/bin/env node
import * as tsNode from 'ts-node'
tsNode.register({
  transpileOnly: true,
  compilerOptions: {
    module: 'node16',
    target: 'esnext',
  },
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
