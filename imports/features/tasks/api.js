import Api from "../../api";
import Model, { TaskCollection } from "./collection";
import _ from "lodash";
import Constructor from "../base/api";
import { serverError500 } from "../base/api";
import { 
  pagination, 
  addTask, 
  getTaskStatus, 
  cancelTask,
  TaskStatus,
  initializeTaskRecovery 
} from "./service";
import { Meteor } from 'meteor/meteor';

Constructor("tasks", Model);

// Initialize task recovery when server starts
if (Meteor.isServer) {
  Meteor.startup(async () => {
    await initializeTaskRecovery();
  });
}

Api.addCollection(TaskCollection, {
  path: "tasks",
  routeOptions: { authRequired: false },
});

Api.addRoute("tasks/model", {
  get: function () {
    return {
      fields: Model.schema.fields,
      fieldsNames: Model.schema.fieldsNames,
    };
  },
});

Api.addRoute("tasks/pagination", {
  post: function () {
    try {
      return pagination(this.bodyParams);
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

// Add new task
Api.addRoute("tasks/add", {
  post: function () {
    try {
      const taskData = this.bodyParams;
      return addTask({
        ...taskData,
        createdBy: this.userId,
        group: this.userId,
        createdAt: new Date(),
      });
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

// Get task status
Api.addRoute("tasks/status/:jobId", {
  get: function () {
    try {
      const { jobId } = this.urlParams;
      return getTaskStatus(jobId);
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

// Cancel task
Api.addRoute("tasks/cancel/:jobId", {
  post: function () {
    try {
      const { jobId } = this.urlParams;
      return cancelTask(jobId);
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

// Get task statuses
Api.addRoute("tasks/statuses", {
  get: function () {
    return TaskStatus;
  },
});
