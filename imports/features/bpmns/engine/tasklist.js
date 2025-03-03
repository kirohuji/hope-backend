/* global Bpmn:true */
import { check, Match } from "meteor/check";
import { Mongo } from "meteor/mongo";
import { Meteor } from "meteor/meteor";
import Bpmn from "./engine";

const { EventEmitter } = require("events");

const _name = "extensions:tasklist";

const tasklist = {};

// //////////////////////////////////////////////////////////////////////////////////////
//
//  Define Collection
//
// //////////////////////////////////////////////////////////////////////////////////////

const BpmnTasklistCollectionSchema = {
  instanceId: String,
  id: String,
  type: String,
  name: String,
  formKey: {
    type: String,
    optional: true,
  },
  assignee: {
    type: String,
    optional: true,
  },
  candidateGroups: {
    type: String,
    optional: true,
  },
  candidateUsers: {
    type: String,
    optional: true,
  },
  dueDate: {
    type: Date,
    optional: true,
  },
  followupDate: {
    type: Date,
    optional: true,
  },
  priority: {
    type: String,
    optional: true,
  },
  documentation: {
    type: String,
    optional: true,
  },
};

const collectionName = "BpmnTasklistCollection";
const BpmnTaskListCollection = new Mongo.Collection(collectionName);
BpmnTaskListCollection.name = collectionName;
BpmnTaskListCollection.schema = BpmnTasklistCollectionSchema;
tasklist.collection = BpmnTaskListCollection;
tasklist.methods = {};

Meteor.startup(() => {
  if (Meteor.isServer) {
    const userTask = BpmnTaskListCollection.findOne();
    BpmnTaskListCollection.remove({});
  }
});

// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// clear
// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const nonEmptyString = Match.Where(
  (s) => typeof s === "string" && s.length > 0
);
const isUserTask = Match.Where((t) => {
  if (!t || !t.id || !t.name) return false;
  let is = true;
  Object.keys(t).forEach((key) => {
    is = is && !!BpmnTasklistCollectionSchema[key];
  });
  return is;
});

tasklist.remove = function remove(query) {
  check(query, {
    instanceId: String,
    id: Match.Maybe(String),
  });
  return BpmnTaskListCollection.remove(query);
};

tasklist.add = function add(instanceId, userTask) {
  check(instanceId, String);
  check(userTask, isUserTask);

  if (BpmnTaskListCollection.findOne({ instanceId, id: userTask.id })) {
    throw new Error("try to add a task that already exist");
  }

  const insertTarget = Object.assign({}, userTask);

  // transform date fields into Date object fields
  // to support mongo native sort by ISO Date

  if (typeof insertTarget.dueDate !== "undefined") {
    insertTarget.dueDate = new Date(insertTarget.dueDate);
  }

  if (typeof insertTarget.followupDate !== "undefined") {
    insertTarget.followupDate = new Date(insertTarget.followupDate);
  }

  const insertTask = Object.assign({}, userTask, { instanceId });
  return BpmnTaskListCollection.insert(insertTask);
};

// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Hooks
// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const tasklistHooks = {};

// EXECUTE

tasklistHooks.onExecuteBefore = function (engineFct, options) {
  const engine = engineFct();
  engine.on(
    "end",
    Meteor.bindEnvironment(() => {
      const innserEngine = engineFct();
      const { instanceId } = innserEngine;
      tasklist.remove({ instanceId });
    })
  );

  const tasklistListener = new EventEmitter();

  tasklistListener.on(
    "wait",
    Meteor.bindEnvironment((userTask) => {
      const innserEngine = engineFct();
      const { instanceId } = innserEngine;
      tasklist.add(instanceId, clean(userTask.activity));
    })
  );

  tasklistListener.on(
    "end-userTask",
    Meteor.bindEnvironment((userTask) => {
      const innerEngine = engineFct();
      const { instanceId } = innerEngine;
      tasklist.remove({ instanceId, id: userTask.activity.id });
    })
  );

  options.listener = Bpmn.mergeListeners({
    source: options.listener,
    target: tasklistListener,
  });
};

// make mongo compatible
function clean(userTask) {
  const activity = userTask;
  activity.type = activity.$type;
  delete activity.$type;
  return activity;
}

// RESUME

tasklistHooks.onResumeBefore = function (engineFct, options) {
  const tasklistListener = new EventEmitter();

  tasklistListener.on(
    "wait",
    Meteor.bindEnvironment((userTask) => {
      const engine = engineFct();
      const { instanceId } = engine;
      tasklist.add(instanceId, clean(userTask.activity));
    })
  );

  tasklistListener.on(
    "end-userTask",
    Meteor.bindEnvironment((userTask) => {
      const engine = engineFct();
      const { instanceId } = engine;
      tasklist.remove({ instanceId, id: userTask.activity.id });
    })
  );

  options.listener = Bpmn.mergeListeners({
    source: options.listener,
    target: tasklistListener,
  });
};

tasklistHooks.onResumeAfter = Meteor.bindEnvironment(function (engineFct) {
  const engine = engineFct();
  engine.on(
    "end",
    Meteor.bindEnvironment(() => {
      const innerEngine = engineFct();
      const { instanceId } = innerEngine;
      tasklist.remove({ instanceId });
    })
  );
});

tasklist.hooks = tasklistHooks;

tasklist.on = function on() {
  Bpmn.hooks.add(_name, tasklistHooks);
};

tasklist.off = function off() {
  Bpmn.hooks.remove(_name);
};

// //////////////////////////////////////////////////////////////////////////////////////
//
//  ASSIGN EXTENSION
//
// //////////////////////////////////////////////////////////////////////////////////////

Bpmn.tasklist = tasklist;
