#!/usr/bin/env node
import pkg = require('../package.json')

import { Command } from 'commander'
import { start } from './express-start'

const program = new Command('express')
program.usage('[command]').version(pkg.version.toString())

start(program)

program.parse(process.argv)
