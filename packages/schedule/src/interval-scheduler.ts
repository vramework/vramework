import { CoreAPIFunctionSessionless, CoreScheduledTask, CoreServices, CoreSingletonServices, CoreUserSession, CreateSessionServices, getScheduledTasks, runScheduledTask } from '@vramework/core'
import { IntervalBasedCronScheduler } from 'cron-schedule/schedulers/interval-based.js'
import { parseCronExpression } from 'cron-schedule'

export interface IntervalScheduleTaskRunnerOptions {
    interval: number
}

export class IntervalTaskScheduler<SingletonServices extends CoreSingletonServices, SessionServices extends CoreServices<SingletonServices>, UserSession extends CoreUserSession> {
    private scheduler: IntervalBasedCronScheduler
    private tasks: Map<string, number> = new Map()

    constructor(
        private singletonService: SingletonServices,
        private createSessionServices: CreateSessionServices<SingletonServices, UserSession, SessionServices>,
        private options: IntervalScheduleTaskRunnerOptions) {
        this.scheduler = new IntervalBasedCronScheduler(this.options.interval)
    }

    public scheduleAllTasks () {
        const { scheduledTasks } = getScheduledTasks()
        scheduledTasks.forEach(this.scheduleTask)
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
            this.scheduler.unregisterTask(handler)
            this.tasks.delete(name)
        }
    }

    private scheduleTask(task: CoreScheduledTask<CoreAPIFunctionSessionless<void, void>>) {
        const cron = parseCronExpression(task.schedule)
        const handle = this.scheduler.registerTask(cron, () => {
            runScheduledTask({
                singletonServices: this.singletonService,
                createSessionServices: this.createSessionServices as any,
                ...task
            })
        })
        this.tasks.set(task.name, handle)
    }
}
