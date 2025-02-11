import { createConfig } from '@pikku-workspace-starter/functions/src/config'
import { createSingletonServices } from '@pikku-workspace-starter/functions/src/services'
import {
  Config,
  SingletonServices,
} from '@pikku-workspace-starter/functions/src/application-types'
import { AWSSecrets } from '@pikku/aws-services'
import { LocalVariablesService } from '@pikku/core'

let config: Config
let singletonServices: SingletonServices

export const coldStart = async () => {
  if (!config) {
    config = await createConfig()
  }
  if (!singletonServices) {
    singletonServices = await createSingletonServices(config, {
      secretServce: new AWSSecrets(config),
    })
  }
  return singletonServices
}
