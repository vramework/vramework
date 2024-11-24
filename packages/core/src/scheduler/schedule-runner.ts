import { getErrorResponse } from '../error-handler.js'
import {
  CoreServices,
  CoreSingletonServices,
  CoreUserSession,
  CreateSessionServices,
} from '../types/core.types.js'
import {
  CoreScheduledTask,
  CoreScheduledTasks,
  ScheduledTasksMeta,
} from './schedule.types.js'
import { CoreAPIFunctionSessionless } from '../types/functions.types.js'
import { closeServices } from '../utils.js'

export type RunScheduledTasksParams = {
  name: string
  session?: CoreUserSession
  singletonServices: CoreSingletonServices
  createSessionServices: CreateSessionServices<
    CoreSingletonServices,
    CoreUserSession,
    CoreServices
  >
}

export type RunCronParams = {
  singletonServices: CoreSingletonServices
  createSessionServices: CreateSessionServices<
    CoreSingletonServices,
    CoreUserSession,
    CoreServices
  >
}

let scheduledTasks: CoreScheduledTasks = []
let scheduledTasksMeta: ScheduledTasksMeta = []

export const addScheduledTask = <
  APIFunction extends CoreAPIFunctionSessionless<void, void>,
>(
  scheduledTask: CoreScheduledTask<APIFunction>
) => {
  scheduledTasks.push(scheduledTask as any)
}

export const clearScheduledTasks = () => {
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
export const runScheduledTask = async ({
  name,
  session,
  singletonServices,
  createSessionServices,
}: RunScheduledTasksParams): Promise<void> => {
  let sessionServices: CoreServices | undefined
  const trackerId: string = crypto.randomUUID().toString()

  try {
    const task = scheduledTasks.find((task) => task.name === name)

    if (!task) {
      throw new ScheduledTaskNotFoundError(`Scheduled task not found: ${name}`)
    }

    singletonServices.logger.info(
      `Running schedule task: ${name} | schedule: ${task.schedule}}`
    )

    const sessionServices = await createSessionServices(
      singletonServices,
      {},
      session
    )
    const allServices = { ...singletonServices, ...sessionServices }

    await task.func(allServices, undefined, session!)
  } catch (e: any) {
    const errorResponse = getErrorResponse(e)

    if (errorResponse != null) {
      singletonServices.logger.warn(`Error id: ${trackerId}`)
      singletonServices.logger.error(e)
    }

    throw e
  } finally {
    await closeServices(singletonServices.logger, sessionServices)
  }
}
