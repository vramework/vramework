import { getErrorResponse } from './error-handler.js'
import {
  CoreServices,
  CoreSingletonServices,
  CoreUserSession,
  CreateSessionServices,
} from './types/core.types.js'
import { CoreScheduledTask, CoreScheduledTasks, ScheduledTasksMeta } from './types/schedule.types.js'
import { CoreAPIFunctionSessionless } from './types/functions.types.js'

export type RunScheduledTasksParams = {
  title: string,
  session?: CoreUserSession,
  singletonServices: CoreSingletonServices,
  createSessionServices: CreateSessionServices<
    CoreSingletonServices,
    CoreUserSession,
    CoreServices
  >
}

export type RunCronParams = {
  singletonServices: CoreSingletonServices,
  createSessionServices: CreateSessionServices<
    CoreSingletonServices,
    CoreUserSession,
    CoreServices
  >
}

let scheduledTasks: CoreScheduledTasks = []
let scheduledTasksMeta: ScheduledTasksMeta = []

export const addScheduledTask = <APIFunction extends CoreAPIFunctionSessionless<void, void>>(
  scheduledTask: CoreScheduledTask<APIFunction>
) => {
  scheduledTasks.push(scheduledTask as any)
}

export const clearCronJobs = () => {
  scheduledTasks = []
}

/**
 * Returns all the cron jobs
 * @internal
 */
export const getScheduledTasks = () => {
  return {
    scheduledTasks,
    scheduledTasksMeta,
  }
}

class ScheduledTaskNotFoundError extends Error {
  constructor(title: string) {
    super(`Scheduled task not found: ${title}`)
  }
}

/**
 * @ignore
 */
export const runScheduledTask = async (
  {
    title,
    session,
    singletonServices,
    createSessionServices,
  }: RunScheduledTasksParams
): Promise<void> => {
  let sessionServices: CoreServices | undefined
  const trackerId: string = crypto.randomUUID().toString()

  try {
    const task = scheduledTasks.find((task) => task.title === title)

    if (!task) {
      throw new ScheduledTaskNotFoundError(`Scheduled task not found: ${title}`)
    }

    singletonServices.logger.info(`Running schedule task: ${title} | schedule: ${task.schedule}}`)

    const sessionServices = await createSessionServices(
      singletonServices,
      {},
      session
    )
    const allServices = { ...singletonServices, ...sessionServices }

    await task.func(
      allServices,
      undefined,
      session!
    )
  } catch (e: any) {
    const errorResponse = getErrorResponse(e)

    if (errorResponse != null) {
      singletonServices.logger.warn(`Error id: ${trackerId}`)
      singletonServices.logger.error(e)
    }

    throw e
  } finally {
    if (sessionServices) {
      await Promise.all(
        Object.values(sessionServices).map(async (service) => {
          if (service?.close) {
            try {
              await service.close()
            } catch (e) {
              singletonServices.logger.error(e)
            }
          }
        })
      )
    }
  }
}
