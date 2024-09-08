#!/usr/bin/env node
import { Command } from 'commander'
import { schemas } from './vramework-schemas'

const program = new Command('vramework')
program.usage('[command]')

schemas(program)

program.parse(process.argv)