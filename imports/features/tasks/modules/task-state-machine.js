import { TaskCollection } from '../collection';
import { TaskStatus } from '../service';

export class TaskStateMachine {
  constructor(job) {
    this.job = job;
    this.jobId = job.id.toString();
  }

  async transitionTo(status, result) {
    await TaskCollection.update(
      { jobId: this.jobId },
      {
        $set: {
          status,
          result,
          updatedAt: new Date(),
        },
      },
    );
  }

  async handleError(error) {
    await TaskCollection.update(
      { jobId: this.jobId },
      {
        $set: {
          status: TaskStatus.FAILED,
          error: error.message,
          updatedAt: new Date(),
        },
      },
    );
    throw error;
  }

  async execute() {
    try {
      await this.transitionTo(TaskStatus.ACTIVE);
      const result = await this.process();
      await this.transitionTo(TaskStatus.COMPLETED, result);
      return { success: true, result };
    } catch (error) {
      await this.handleError(error);
    }
  }

  async process() {
    throw new Error('process() must be implemented by subclass');
  }
} 