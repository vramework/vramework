import { getConfig } from '../src/config.js'
import { ExpressServer } from '../src/server.js'
import { createSingletonServices } from '../../functions/src/services.js'
import { PikkuTaskScheduler} from '@pikku/schedule'
import { ScheduledTaskNames } from '../.pikku/pikku-schedules.js'
 
async function main(): Promise<void> {
  try {
    const config = await getConfig()
    const singletonServices = await createSingletonServices(config)
    const expressServer = new ExpressServer(singletonServices)
    await expressServer.start()

    const scheduler = new PikkuTaskScheduler<ScheduledTaskNames>(singletonServices)
    scheduler.startAll()
  } catch (e: any) {
    console.error(e.toString())
    process.exit(1)
  }
}

main()
