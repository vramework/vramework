import { Logger } from '../services/index.js'
import { getScheduledTasks } from './schedule-runner.js'

/**
 * Logs all the loaded scheduled tasks.
 * @param logger - A logger for logging information.
 */
export const logSchedulers = (logger: Logger) => {
  const { scheduledTasks } = getScheduledTasks()
  if (scheduledTasks.length === 0) {
    logger.info('No scheduled tasks added')
    return
  }

  let scheduledTasksMessage = 'Scheduled tasks:'
  for (const { name, schedule } of scheduledTasks) {
    scheduledTasksMessage += `\n\t- ${name} -> ${schedule}`
  }
  logger.info(scheduledTasksMessage)
}
