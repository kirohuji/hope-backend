/* global hashWithSalt Bpmn */
import { check, Match } from "meteor/check";
import { Mongo } from "meteor/mongo";
import { Meteor } from "meteor/meteor";
import Bpmn from "./engine";
const _name = "extensions:persistence";
const bcrypt = require("bcryptjs");

async function hashWithSalt(data) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(data, salt);
}

const persistence = {};

// //////////////////////////////////////////////////////////////////////////////////////
//
//  Define Collection
//
// //////////////////////////////////////////////////////////////////////////////////////

const BpmnPersistenceCollectionSchema = {
  instanceId: String,
  state: {
    type: String,
  },
  hash: String,
  createdAt: {
    type: String,
  },
  createdBy: {
    type: String,
  },
};

const collectionName = "BpmnPersistenceCollection";
const BpmnPersistenceCollection = new Mongo.Collection(collectionName);
BpmnPersistenceCollection.name = collectionName;
BpmnPersistenceCollection.schema = BpmnPersistenceCollectionSchema;
persistence.collection = BpmnPersistenceCollection;
persistence.methods = {};

// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//  savePersistent
//
// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const hashMatch = Match.Where(
  (h) => !!h && typeof h === "string" && h.length === 64
);

const stateObjMatch = Match.Where(
  (s) => !!s && !!s.name && !!s.state && !!s.engineVersion && !!s.definitions
);

persistence.has = function (instanceId) {
  check(instanceId, String);
  return !!BpmnPersistenceCollection.findOne({ instanceId });
};

/**
 * Check a state against a given hash
 * @param state a state from the engine, given by engine.getState()
 * @param hash a given hash as created by Bpmn.persistence.save
 * @returns {boolean} true if the hash created for the state equals the given hash
 */
persistence.verify = function (state, hash) {
  check(state, Match.OneOf(String, stateObjMatch));
  check(hash, hashMatch);
  const stateStr = typeof state === "string" ? state : JSON.stringify(state);
  return hashWithSalt(stateStr) === hash;
};

const hashCache = {};

/**
 * Saves the current process' state. The state is serialized to a JSON, that can be de-serialized
 * using the Bpmn.persistence.load method.
 */
persistence.save = function ({ instanceId, state, userId = "anonymous" }) {
  check(instanceId, String);
  // check(state, stateObjMatch);
  check(userId, String);

  const timeStamp = new Date();

  const stateStr = JSON.stringify(state);
  const hash = hashWithSalt(stateStr || "");
  const cacheId = instanceId + hash;

  // in order to find doubles
  // in async environment
  // we don't wait the insert
  // to be completed but use a
  // cache object
  if (hashCache[cacheId]) {
    return false;
  }
  hashCache[cacheId] = true;

  // on long term checks
  // we don't need the cache
  // but take a direct lookup
  // into the collection
  if (BpmnPersistenceCollection.findOne({ instanceId, hash })) {
    return false;
  }

  const mongoCompatibleStateStr = stateStr.replace(/\$/g, "__dollar__"); // TODO add compression
  const insertId = BpmnPersistenceCollection.insert({
    state: mongoCompatibleStateStr,
    hash,
    instanceId,
    createdAt: timeStamp,
    createdBy: userId,
  });

  // prevent memory leak
  // and delete the cache once
  // the doc has been saved
  delete hashCache[cacheId];

  return insertId;
};

// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//  loadPersistent
//
// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function load(persistenceDoc) {
  check(
    persistenceDoc,
    Match.Where((x) => x && typeof x === "object")
  );
  const stateStr = persistenceDoc.state.replace(/__dollar__/g, "$");

  if (!persistence.verify(stateStr, persistenceDoc.hash)) {
    throw new Error(
      "invalid hash signature for persistence state. instanceId=" +
        persistenceDoc.instanceId
    );
  }

  persistenceDoc.state = JSON.parse(stateStr);
  return persistenceDoc;
}

persistence.load = function (persistenceDocId) {
  check(persistenceDocId, String);
  const persistenceDoc = BpmnPersistenceCollection.findOne(persistenceDocId, {
    sort: { createdAt: -1 },
  });
  return load(persistenceDoc);
};

persistence.latest = function (instanceId) {
  check(instanceId, String);

  const persistenceDoc = BpmnPersistenceCollection.findOne(
    { instanceId },
    { hint: { $natural: -1 } }
  );
  return load(persistenceDoc);
};

// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//  Hooks
//
// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const persistenceHooks = {};

// EXECUTE

persistenceHooks.onExecuteBefore = function (engineFct, options) {
  const preventEvents = options && options.prevent;

  // listen to engine's end unless prevented
  const preventEnd = preventEvents && preventEvents.end === false;

  if (!preventEnd) {
    const engine = engineFct();
    engine.on(
      "end",
      Meteor.bindEnvironment(() => {
        if (engine.stopped) return;
        persistence.save({
          instanceId: engine.instanceId,
          state: engine.getState(),
          userId: this.userId,
        });
      })
    );
  }

  const persistenceListener = Bpmn.createListeners(
    (element, instance, event) => {
      const engine = engineFct();
      persistence.save({
        instanceId: engine.instanceId,
        userId: this.userId,
        state: engine.getState(),
      });
    },
    preventEvents
  );

  options.listener = Bpmn.mergeListeners({
    source: options.listener,
    target: persistenceListener,
  });
};

// RESUME

persistenceHooks.onResumeBefore = function (engineFct, options) {
  const preventEvents = options && options.prevent;

  const persistenceListener = Bpmn.createListeners(() => {
    const engine = engineFct();
    persistence.save({
      instanceId: options.instanceId,
      state: engine && engine.getState(),
    });
  }, preventEvents);

  options.listener = Bpmn.mergeListeners({
    source: options.listener,
    target: persistenceListener,
  });
};

persistenceHooks.onResumeAfter = Meteor.bindEnvironment(function (
  engineFct,
  options
) {
  const engine = engineFct();
  engine.instanceId = options.instanceId;
  engine.on("end", () => {
    if (engine.stopped) return;
    persistence.save({
      instanceId: options.instanceId,
      state: engine && engine.getState(),
    });
  });
});

// STOP

persistenceHooks.onStopBefore = Meteor.bindEnvironment(function (engineFct) {
  const engine = engineFct();
  persistence.save({ instanceId: engine.instanceId, state: engine.getState() });
});

persistence.hooks = persistenceHooks;

persistence.on = function on() {
  Bpmn.hooks.add(_name, persistenceHooks);
};

persistence.off = function off() {
  Bpmn.hooks.remove(_name);
};

// //////////////////////////////////////////////////////////////////////////////////////
//
//  ASSIGN EXTENSION
//
// //////////////////////////////////////////////////////////////////////////////////////

Bpmn.persistence = persistence;
