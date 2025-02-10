import { ScheduledHandler } from 'aws-lambda'
import '@pikku-workspace-starter/functions/.pikku/pikku-schedules.gen'

import { runScheduledTask } from '@pikku/core/scheduler'
import { coldStart } from './cold-start.js'

export const expireTodos: ScheduledHandler = async (event) => {
  const singletonServices = await coldStart()
  await runScheduledTask({
    name: 'expireTodos',
    singletonServices,
  })
}
