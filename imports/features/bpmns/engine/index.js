import Bpmn from "./engine";
import { Extensions } from "./extensions";
import "./tasklist.js";
import "./persistence.js";
import "./history.js";
import "./instances.js";
Bpmn.persistence.on();
Bpmn.tasklist.on();
Bpmn.history.on();
Bpmn.persistence.on();
const extensions = Bpmn.extensions.getAll();
extensions.forEach((entry) => {
  const extension = entry.ref;
  const { ns } = extension;
  const query = { ns };
  const extensionDoc = Extensions.collection.findOne(query);
  if (extensionDoc) {
    const updated = Bpmn.extensions.status(ns, extensionDoc.isActive);
    console.log(
      `[${ns}] restored extension active status to [${extensionDoc.isActive}] succeded with ${updated}`
    );
  } else {
    const { isActive } = entry;
    const insertDoc = Object.assign({}, extension, { isActive });
    delete insertDoc.collection;
    const insertDocId = Extensions.collection.insert(insertDoc);
    console.log(`[${ns}] created extension entry with id [${insertDocId}]`);
  }
});
