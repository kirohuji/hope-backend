/* global Bpmn:true */
import { Mongo } from "meteor/mongo";
import { Meteor } from "meteor/meteor";
import { check, Match } from "meteor/check";
import Bpmn from "./engine";
const { EventEmitter } = require("events");
const isString = (s) => s && typeof s === "string" && s.length > 0;

// //////////////////////////////////////////////////////////////////////////////////////
//
//  Define Instances Collection
//
// //////////////////////////////////////////////////////////////////////////////////////

const BpmnEngineInstancesSchema = {
  instanceId: String,
};

const collectionName = "BpmnEngineInstances";
const BpmnEngineInstances = new Mongo.Collection(collectionName);
BpmnEngineInstances.name = collectionName;
BpmnEngineInstances.schema = BpmnEngineInstancesSchema;

// wipe collection
// at startup
Meteor.startup(() => {
  if (Meteor.isServer) {
    const allInstances = BpmnEngineInstances.find({}).fetch();
    BpmnEngineInstances.remove({});
    allInstances
      .map((entry) => entry.instanceId)
      .forEach((instanceId) => {
        Bpmn.processes.collection.update(
          { instanceId },
          { $set: { state: Bpmn.States.stopped } }
        );
      });
  }
});

// //////////////////////////////////////////////////////////////////////////////////////
//
//  Define API
//
// //////////////////////////////////////////////////////////////////////////////////////

const _cache = {};

const instances = {};
instances.ns = "extensions.instances";
instances.name = "Instances";
instances.description = "Manages running in-memory process instances.";
instances.collection = BpmnEngineInstances;
instances.methods = {};

instances.get = function get(instanceId) {
  check(instanceId, Match.Where(isString));
  return _cache[instanceId];
};

instances.size = function size() {
  return Object.keys(_cache).length;
};

instances.has = function has(instanceId) {
  check(instanceId, Match.Where(isString));
  return !!BpmnEngineInstances.findOne({ instanceId }) && !!_cache[instanceId];
};

instances.add = function add({ instanceId, engine }) {
  check(instanceId, Match.Where(isString));
  check(
    engine,
    Match.Where((en) => en && en.constructor === EventEmitter)
  );

  if (instances.has(instanceId))
    throw new Error("documemnt exists by instanceid");

  const insertId = BpmnEngineInstances.insert({ instanceId });
  if (!insertId)
    throw new Error(
      "could not insert instance record by instanceId " + instanceId
    );
  _cache[instanceId] = engine;

  if (!instances.has(instanceId))
    throw new Error(
      "could not add engine to cache by instanceId " + instanceId
    );
  return insertId;
};

// //////////////////////////////////////////////////////////////////////////////////////
//
//  removeInstance
//
// //////////////////////////////////////////////////////////////////////////////////////

instances.remove = function remove({ instanceId }) {
  check(instanceId, Match.Where(isString));
  if (!instances.has(instanceId))
    throw new Error("engine instance not found by id " + instanceId);
  return (
    delete _cache[instanceId] && BpmnEngineInstances.remove({ instanceId })
  );
};

instances.clear = function () {
  BpmnEngineInstances.find({})
    .fetch()
    .forEach((entry) => {
      instances.remove({ instanceId: entry.instanceId });
    });
  return BpmnEngineInstances.find().count() === 0;
};

// //////////////////////////////////////////////////////////////////////////////////////
//
//  Hooks
//
// //////////////////////////////////////////////////////////////////////////////////////

const instanceHooks = {};

instanceHooks.onExecuteBefore = function (engineFct) {
  const engine = engineFct();
  engine.on(
    "end",
    Meteor.bindEnvironment(() => {
      const removed = instances.remove({ instanceId: engine.instanceId });
      if (!removed)
        throw new Error(
          "expected instance to be removed by instanceId ",
          engine.instanceId
        );
    })
  );
};

instanceHooks.onExecuteAfter = Meteor.bindEnvironment(function (engineFct) {
  const engine = engineFct();
  instances.add({ instanceId: engine.instanceId, engine });
});

instanceHooks.onResumeAfter = Meteor.bindEnvironment(function (engineFct) {
  const engine = engineFct();
  engine.on(
    "end",
    Meteor.bindEnvironment(() => {
      const removed = instances.remove({ instanceId: engine.instanceId });
      if (!removed)
        throw new Error(
          "expected instance to be removed by instanceId ",
          engine.instanceId
        );
    })
  );
  instances.add({ instanceId: engine.instanceId, engine });
});

instances.hooks = instanceHooks;

instances.on = function on() {
  Bpmn.hooks.add(instances.ns, instanceHooks);
};

instances.off = function off() {
  Bpmn.hooks.remove(instances.ns);
};

// //////////////////////////////////////////////////////////////////////////////////////
//
//  Assign
//
// //////////////////////////////////////////////////////////////////////////////////////

Bpmn.instances = instances;
Bpmn.extensions.add(instances.ns, instances, true);
