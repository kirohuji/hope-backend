import { TaskCollection } from '../collection';
import { TaskStatus } from '../service';

export class TaskStateMachine {
  constructor(job) {
    this.job = job;
    this.jobId = job.id.toString();
  }

  async transitionTo(status) {
    await TaskCollection.update(
      { jobId: this.jobId },
      {
        $set: {
          status,
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
      await this.process();
      await this.transitionTo(TaskStatus.COMPLETED);
      return { success: true };
    } catch (error) {
      await this.handleError(error);
    }
  }

  async process() {
    throw new Error('process() must be implemented by subclass');
  }
} 