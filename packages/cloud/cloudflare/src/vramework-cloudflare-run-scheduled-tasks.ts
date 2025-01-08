import { ScheduledController } from "@cloudflare/workers-types"
import { CoreSingletonServices, CreateSessionServices } from "@vramework/core"
import { getScheduledTasks, runScheduledTask } from "@vramework/core/scheduler"

export const runScheduledTasks = async (controller: ScheduledController, singletonServices: CoreSingletonServices, createSessionServices?: CreateSessionServices) => {
    const { scheduledTasks } = getScheduledTasks()
    for (const [name, task] of scheduledTasks) {
        if (task.schedule === controller.cron) {
            return await runScheduledTask({
                name,
                singletonServices,
                createSessionServices
            })
        }
    }
}
