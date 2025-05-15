import { AITask } from './ai-task';

export class TaskFactory {
  static createTask(type, job) {
    switch (type) {
      case 'ai':
        return new AITask(job);
      default:
        throw new Error(`Unknown task type: ${type}`);
    }
  }
} 