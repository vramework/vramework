import { PikkuUWSServer } from '@pikku/uws'

import 'import '../../functions/.pikku/pikku-bootstrap.gen''
import { createConfig, createSessionServices, createSingletonServices } from '../../functions/src/services'

async function main(): Promise<void> {
  try {
    const config = await createConfig()
    const singletonServices = await createSingletonServices(config)
    const appServer = new PikkuUWSServer(
      { ...config, hostname: 'localhost', port: 4002 },
      singletonServices,
      createSessionServices
    )
    appServer.enableExitOnSigInt()
    await appServer.init()
    await appServer.start()
  } catch (e: any) {
    console.error(e.toString())
    process.exit(1)
  }
}

main()
