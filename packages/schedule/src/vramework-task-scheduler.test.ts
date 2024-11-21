// import { test, describe, beforeEach, afterEach } from 'node:test';
// import assert from 'assert';
// import sinon, { SinonSandbox, SinonStub } from 'sinon';
// import { CronJob } from 'cron';
// import {
//     CoreSingletonServices,
//     CoreScheduledTask,
//     CoreAPIFunctionSessionless,
//     CoreUserSession,
//     addScheduledTask,
// } from '@vramework/core';
// import { VrameworkTaskScheduler } from './vramework-task-scheduler.js';
// import { clearScheduledTasks } from '@vramework/core/schedule-runner';

// type MockSingletonServices = CoreSingletonServices & {
//     logger: { info: sinon.SinonStub; debug: sinon.SinonStub };
// };

// describe('VrameworkTaskScheduler', () => {
//     let scheduler: VrameworkTaskScheduler<
//         MockSingletonServices,
//         any,
//         CoreUserSession
//     >;
//     let singletonServicesMock: MockSingletonServices;
//     let createSessionServicesMock: sinon.SinonStub;
//     let sandbox: SinonSandbox;

//     const task1: CoreScheduledTask<
//         CoreAPIFunctionSessionless<void, void>,
//         CoreUserSession
//     > = { name: 'task1', schedule: '* * * * *', func: async () => { } };

//     const task2: CoreScheduledTask<
//         CoreAPIFunctionSessionless<void, void>,
//         CoreUserSession
//     > = { name: 'task2', schedule: '*/5 * * * *', func: async () => { } };

//     beforeEach(() => {
//         sandbox = sinon.createSandbox();

//         singletonServicesMock = {
//             logger: {
//                 info: sandbox.stub(),
//                 debug: sandbox.stub(),
//             },
//         } as unknown as MockSingletonServices;

//         createSessionServicesMock = sandbox.stub();

//         scheduler = new VrameworkTaskScheduler(
//             singletonServicesMock,
//             createSessionServicesMock
//         );

//         sandbox.stub(CronJob.prototype, 'start');
//         sandbox.stub(CronJob.prototype, 'stop');

//         // Reset scheduled tasks for each test
//         clearScheduledTasks()
//     });

//     afterEach(() => {
//         sandbox.restore();
//     });

//     test('startAll should start all scheduled tasks', async () => {
//         addScheduledTask(task1);
//         addScheduledTask(task2);

//         scheduler.startAll();

//         assert.strictEqual((CronJob.prototype.start as SinonStub).callCount, 2);
//         assert.strictEqual(scheduler['jobs'].size, 2);
//         assert(scheduler['jobs'].has('task1'));
//         assert(scheduler['jobs'].has('task2'));
//     });

// test('stopAll should stop all running tasks and clear the jobs map', () => {
//     const jobMock = { stop: sandbox.stub() } as unknown as CronJob;
//     scheduler['jobs'].set('task1', jobMock);
//     scheduler['jobs'].set('task2', jobMock);

//     scheduler.stopAll();

//     assert.strictEqual((jobMock.stop as SinonStub).callCount, 2);
//     assert.strictEqual(scheduler['jobs'].size, 0);
// });

// test('start should only start specified tasks', () => {
//     addScheduledTask(task1);
//     addScheduledTask(task2);

//     scheduler.start(['task1']);

//     assert.strictEqual((CronJob.prototype.start as SinonStub).callCount, 1);
//     assert.strictEqual(scheduler['jobs'].size, 1);
//     assert(scheduler['jobs'].has('task1'));
//     assert(!scheduler['jobs'].has('task2'));
// });

// test('stop should only stop specified tasks', () => {
//     const jobMock = { stop: sandbox.stub() } as unknown as CronJob;
//     scheduler['jobs'].set('task1', jobMock);
//     scheduler['jobs'].set('task2', jobMock);

//     scheduler.stop(['task1']);

//     assert.strictEqual((jobMock.stop as SinonStub).callCount, 1);
//     assert.strictEqual(scheduler['jobs'].size, 1);
//     assert(scheduler['jobs'].has('task2'));
//     assert(!scheduler['jobs'].has('task1'));
// });
// });
