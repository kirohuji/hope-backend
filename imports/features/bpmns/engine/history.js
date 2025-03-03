/* global Bpmn:true */
import { Mongo } from "meteor/mongo";
import { check, Match } from "meteor/check";
import { Meteor } from "meteor/meteor";
import Bpmn from "./engine";
const _name = "extensions:history";

const history = {};
history.name = _name;

// //////////////////////////////////////////////////////////////////////////////////////
//
//  Extend Events
//
// //////////////////////////////////////////////////////////////////////////////////////

/**
 * @override Bpmn.Events
 * @description Extends the default list of events by 'resume' and 'stop' which are added to the history on stop/resume.
 * @type {String}
 */
Bpmn.Events = Object.assign(Bpmn.Events, {
  resume: "resume",
  stop: "stop",
});

// //////////////////////////////////////////////////////////////////////////////////////
//
//  Define Collection
//
// //////////////////////////////////////////////////////////////////////////////////////

/**
 * Optional schema, that can be attached to the collection for the history log.
 * @type {{instanceId: String, processId: String, elementId: String, eventName: String, state: String}}
 */
const BpmnHistoryCollectionSchema = {
  createdAt: Date,
  createdBy: String,
  instanceId: String,
  processId: String,
  elementId: String,
  eventName: String,
  stateName: String,
};

/**
 * Default name of the collection for the history log.
 * @type {string}
 */
const historyCollectionName = "bpmn:history";

/**
 * The default collection for logging history of events.
 * @type {Mongo.Collection | String}
 */
const BpmnHistoryCollection = new Mongo.Collection(historyCollectionName);
BpmnHistoryCollection.schema = BpmnHistoryCollectionSchema;
BpmnHistoryCollection.name = historyCollectionName;
history.collection = BpmnHistoryCollection;

// //////////////////////////////////////////////////////////////////////////////////////
//
//  addToHistory
//
// //////////////////////////////////////////////////////////////////////////////////////

history.methods = {};

/**
 * Adds a history entry to the history collection by given parameters.
 * @param eventName The name of the event that occurred. see {Bpmn.Events}
 * @param elementId The id of the current process element (activity), involved in the event.
 * @param processId The id of the current process, involved in the event.
 * @param instanceId The id of the current Bpmn.Engine instance.
 * @param stateName String of the current state, gathered by {Bpmn.Engine.prototype.getState().state}
 * @param userId (optional) id of the user involved int the event.
 * @returns {String} The id of the inserted document.
 */
function addToHistory({
  eventName,
  elementId,
  processId,
  instanceId,
  stateName,
  userId,
}) {
  // check(eventName, String);
  // check(elementId, String);
  // check(processId, String);
  // check(instanceId, String);
  // check(stateName, String);
  // check(userId, Match.Maybe(String));

  const createdBy = userId || this.userId;
  const insertDocId = BpmnHistoryCollection.insert({
    instanceId,
    processId,
    stateName,
    elementId,
    eventName,
    createdAt: new Date(),
    createdBy,
  });
  if (!insertDocId || !BpmnHistoryCollection.findOne(insertDocId))
    throw new Error(
      "history document not inserted on event " +
        eventName +
        " instanceId=" +
        instanceId
    );
  return insertDocId;
}

/**
 * @inheritDoc {addToHistory}
 */
history.add = addToHistory;

// //////////////////////////////////////////////////////////////////////////////////////
//
//  HOOKS
//
// //////////////////////////////////////////////////////////////////////////////////////

const historyHooks = {};

historyHooks.onExecuteBefore = function (engineFct, options) {
  const engine = engineFct();
  const preventEvents = options && options.prevent;

  // listen to engine's end unless prevented
  const preventEnd = preventEvents && preventEvents.end === false;
  if (!preventEnd) {
    engine.on(
      "end",
      Meteor.bindEnvironment((process) => {
        history.add({
          eventName: engine.stopped ? "stop" : "end",
          elementId: process.id,
          instanceId: engine.instanceId || options.instanceId,
          processId: process.id,
          stateName: engine.getState().state,
        });
      })
    );
  }

  // listen to element events
  const historyListener = Bpmn.createListeners(
    (processElement, processInstance, event) => {
      history.add({
        eventName: event,
        elementId: processElement.id,
        instanceId: engine.instanceId,
        processId: processInstance.id,
        stateName: engine.getState().state,
      });
    },
    preventEvents ? preventEvents : undefined
  );

  options.listener = Bpmn.mergeListeners({
    source: options.listener,
    target: historyListener,
  });
};

historyHooks.onResumeBefore = function (engineFct, options) {
  const preventEvents = options && options.prevent;

  // also assign listener
  // on each event on resume
  // but with respect of prevent flags
  const historyListener = Bpmn.createListeners(
    (processElement, processInstance, event) => {
      const engine = engineFct();
      history.add({
        eventName: event,
        elementId: processElement.id,
        instanceId: options.instanceId,
        processId: processInstance.id,
        stateName: engine && engine.getState().state,
      });
    },
    preventEvents ? preventEvents : undefined
  );

  options.listener = Bpmn.mergeListeners({
    source: options.listener,
    target: historyListener,
  });
};

historyHooks.onResume = function (engineFct, options) {
  // log resume event
  const engine = engineFct();
  const instanceId = engine.instanceId || options.instanceId;
  const state = engine.getState();

  Meteor.defer(function () {
    history.add({
      eventName: "resume",
      elementId: "undefined",
      instanceId,
      processId: "undefined",
      stateName: state.state,
    });
  });
};

historyHooks.onResumeAfter = Meteor.bindEnvironment(function (
  engineFct,
  options
) {
  const engine = engineFct();
  const preventEvents = options && options.prevent;

  // listen to engine's end unless prevented
  const preventEnd = preventEvents && preventEvents.end === false;
  if (!preventEnd) {
    engine.on(
      "end",
      Meteor.bindEnvironment((process) => {
        history.add({
          eventName: "end",
          elementId: process.id,
          instanceId: engine.instanceId,
          processId: process.id,
          stateName: engine.getState().state,
        });
      })
    );
  }
});

historyHooks.onStopBefore = Meteor.bindEnvironment(function (engineFct) {
  const engine = engineFct();
  history.add({
    eventName: "stop",
    elementId: "undefined",
    instanceId: engine.instanceId,
    processId: "undefined",
    stateName: engine.getState().state,
  });
});

history.hooks = historyHooks;

history.on = function on() {
  Bpmn.hooks.add(history.name, historyHooks);
};

history.off = function off() {
  Bpmn.hooks.remove(history.name);
};

// //////////////////////////////////////////////////////////////////////////////////////
//
//  ASSIGN EXTENSION
//
// //////////////////////////////////////////////////////////////////////////////////////

Bpmn.history = history;
