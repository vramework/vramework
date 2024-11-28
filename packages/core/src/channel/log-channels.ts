import { Logger } from '../services/index.js'
import { getChannels } from './channel-runner.js'

/**
 * Logs all the loaded channels.
 * @param logger - A logger for logging information.
 */
export const logChannels = (logger: Logger) => {
  const { channels } = getChannels()
  if (channels.length === 0) {
    logger.info('No channels added')
    return
  }

  let scheduledChannels = 'Channels:'
  for (const { route } of channels) {
    scheduledChannels += `\n\t- ${route}`
  }
  logger.info(scheduledChannels)
}
