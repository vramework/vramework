import { CoreAPIFunctionSessionless, CoreScheduledTask, CoreServices, CoreSingletonServices, CoreUserSession, CreateSessionServices, getScheduledTasks, runScheduledTask } from '@vramework/core'
import { TimerBasedCronScheduler as scheduler } from 'cron-schedule/schedulers/timer-based.js'
import { parseCronExpression } from 'cron-schedule'

export class TimerTaskScheduler<SingletonServices extends CoreSingletonServices, SessionServices extends CoreServices<SingletonServices>, UserSession extends CoreUserSession> {
    private tasks: Map<string, any> = new Map()

    constructor(
        private singletonService: SingletonServices,
        private createSessionServices: CreateSessionServices<SingletonServices, UserSession, SessionServices>,
    ) {
    }

    public scheduleAllTasks () {
        const { scheduledTasks } = getScheduledTasks()
        scheduledTasks.forEach(this.scheduleTask as any)
    }

    public startTasks (names: string[]) {
        names.forEach(this.startTask.bind(this))
    }

    public startTask (name: string) {
        const handler = this.tasks.get(name)
        if (!handler) {
            const task = getScheduledTasks().scheduledTasks.find(task => task.name === name)
            if (task) {
                this.scheduleTask(task)
            }
        }
    }

    public stopTasks (names: string[]) {
        names.forEach(this.stopTask.bind(this))
    }

    public stopTask (name: string) {
        const handler = this.tasks.get(name)
        if (handler) {
            scheduler.clearTimeoutOrInterval(handler)
            this.tasks.delete(name)
        }
    }

    private scheduleTask(task: CoreScheduledTask<CoreAPIFunctionSessionless<void, void>, any>) {
        const cron = parseCronExpression(task.schedule)
        const handle = scheduler.setInterval(cron, () => {
            runScheduledTask({
                singletonServices: this.singletonService,
                createSessionServices: this.createSessionServices as any,
                ...task
            })
        })
        this.tasks.set(task.name, handle)
    }
}
