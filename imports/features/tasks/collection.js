import { Class } from "meteor/jagi:astronomy";
export const TaskCollection = new Mongo.Collection("tasks");
export default Class.create({
  name: "Task",
  collection: TaskCollection,
  fields: {
    value: {
      type: String,
      default: "",
    },
    label: {
      type: String,
      default: "",
    },
    jobId: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "",
    },
    data: {
      type: String,
      default: {},
    },
    group: {
      type: String,
      default: "",
    },
    createdBy: { type: String, default: "" },
  },
  behaviors: {
    timestamp: {
      hasCreatedField: true,
      createdFieldName: "createdAt",
      hasUpdatedField: true,
      updatedFieldName: "updatedAt",
    },
    softremove: {
      // The field name with a flag for marking a document as removed.
      removedFieldName: "removed",
      // A flag indicating if a "removedAt" field should be present in a document.
      hasRemovedAtField: true,
      // The field name storing the removal date.
      removedAtFieldName: "removedAt",
    },
  },
});
