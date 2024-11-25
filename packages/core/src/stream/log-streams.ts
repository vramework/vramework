import { Logger } from '../services/index.js'
import { getStreams } from './stream-runner.js'

/**
 * Logs all the loaded streams.
 * @param logger - A logger for logging information.
 */
export const logStreams = (logger: Logger) => {
  const { streams } = getStreams()
  if (streams.length === 0) {
    logger.info('No streams added')
    return
  }

  let scheduledStreams = 'Streams:'
  for (const { route } of streams) {
    scheduledStreams += `\n\t- ${route}`
  }
  logger.info(scheduledStreams)
}
