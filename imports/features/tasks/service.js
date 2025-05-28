import { TaskCollection } from './collection';
import { Queue, Worker } from 'bullmq';
import _ from 'lodash';
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { TaskFactory } from './modules/task-factory';
import moment from 'moment';

// BullMQ queue configuration
const connection = {
  host: '115.159.95.166',
  port: 6379,
  password: 'Zyd1362848650',
};

// Task status constants
export const TaskStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  FAILED: 'failed',
  DELAYED: 'delayed',
};

// Create queue instance
const taskQueue = new Queue('tasks', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: false,
    removeOnFail: false,
  },
});

// Initialize task recovery on server start
export const initializeTaskRecovery = async () => {
  const activeJobs = await taskQueue.getActive();
  const delayedJobs = await taskQueue.getDelayed();
  const waitingJobs = await taskQueue.getWaiting();

  // Update task statuses in database
  for (const job of [...activeJobs, ...delayedJobs, ...waitingJobs]) {
    TaskCollection.update(
      { jobId: job.id },
      {
        $set: {
          status: job.status,
          updatedAt: new Date(),
        },
      },
    );
  }
};

// Add a new task
export const addTask = async taskData => {
  const { type, data, createdAt, group, createdBy, delay } = taskData;
  const job = await taskQueue.add(
    type,
    {
      type,
      data,
      group,
      createdBy,
    },
    {
      delay: delay || 0,
      attempts: 3,
    },
  );

  // Create task record in database
  TaskCollection.insert({
    jobId: job.id,
    type,
    data,
    createdAt: createdAt,
    group,
    createdBy,
    status: TaskStatus.PENDING,
  });

  return job;
};

// Get task status
export const getTaskStatus = async jobId => {
  check(jobId, String);

  const job = await taskQueue.getJob(jobId);
  if (!job) return null;

  const state = await job.getState();
  return state;
};

// Cancel a task
export const cancelTask = async jobId => {
  check(jobId, String);

  const job = await taskQueue.getJob(jobId);
  if (job) {
    await job.remove();
    TaskCollection.update(
      { jobId },
      {
        $set: {
          status: 'cancelled',
          updatedAt: new Date(),
        },
      },
    );
  }
};

// Pagination query
export const pagination = bodyParams => {
  let cursor = TaskCollection.find(
    _.pickBy(bodyParams.selector) || {},
    bodyParams.options,
  );
  return {
    data: cursor.fetch(),
    total: cursor.count(),
  };
};

// Process tasks
if (Meteor.isServer) {
  const worker = new Worker(
    'tasks',
    async job => {
      const { type } = job.data;
      const task = TaskFactory.createTask(type, job);
      return await task.execute();
    },
    {
      connection,
      concurrency: 5,
    },
  );

  // Error handling
  worker.on('error', error => {
    console.error('Task queue error:', error);
  });

  worker.on('failed', (job, error) => {
    console.error(`Job ${job.id} failed:`, error);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    await worker.close();
    await taskQueue.close();
  });
}
