import * as commander from 'commander'
import { ExpressServer } from '@vramework/deploy-express/dist/express-server'

import { config } from '@vramework-example/functions/src/config'
import { setupServices } from "@vramework-example/functions/src/services"
import { getRoutes } from "@vramework-example/functions/src/routes"

// work-around for:
// TS4023: Exported variable 'command' has or is using name 'local.Command'
// from external module "node_modules/commander/typings/index" but cannot be named.
export type Command = commander.Command

async function action(): Promise<void> {
  try {
    const services = await setupServices(config)
    const routes = getRoutes()

    const appServer = new ExpressServer(config, services, routes as any)
    appServer.init().then(() => appServer.start())
    process.removeAllListeners('SIGINT').on('SIGINT', () => {
      appServer.stop()
    })
  } catch (err: any) {
    console.error(err.toString())
    process.exit(1)
  }
}

export const start = (program: Command): void => {
  program.command('start').description('start the express server').action(action)
}
