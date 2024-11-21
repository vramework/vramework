import { CronJob } from 'cron';
import { CoreAPIFunctionSessionless, CoreScheduledTask, CoreServices, CoreSingletonServices, CoreUserSession, CreateSessionServices, getScheduledTasks, runScheduledTask } from '@vramework/core'

export class VrameworkTaskScheduler<SingletonServices extends CoreSingletonServices, Services extends CoreServices<SingletonServices>, UserSession extends CoreUserSession> {
    private jobs = new Map<string, CronJob>()

    constructor(private singletonServices: SingletonServices, private createSessionServices: CreateSessionServices<SingletonServices, UserSession, Services>) { }

    public startAll() {
        const { scheduledTasks } = getScheduledTasks()
        console.log(scheduledTasks)
        scheduledTasks.forEach(task => this.startJobSchedule(task))
    }

    public stopAll() {
        this.jobs.forEach(job => job.stop())
        this.jobs.clear()
    }

    public start(names: string[]) {
        const { scheduledTasks } = getScheduledTasks()
        scheduledTasks
            .filter(task => names.includes(task.name))
            .forEach(task => this.startJobSchedule(task))
    }

    public stop(names: string[]) {
        for (const name of names) {
            const job = this.jobs.get(name)
            if (job) {
                job.stop()
                this.jobs.delete(name)
            }
        }
    }

    private startJobSchedule(task: CoreScheduledTask<CoreAPIFunctionSessionless<void, void>, CoreUserSession>) {
        const job = new CronJob(
            task.schedule,
            async () => {
                console.log(`Running scheduled task: ${task.name}`)
                await runScheduledTask({
                    singletonServices: this.singletonServices,
                    createSessionServices: this.createSessionServices as any,
                    name: task.name,
                })
            },
            null,
            true,
        )
        this.jobs.set(task.name, job)
    }
}