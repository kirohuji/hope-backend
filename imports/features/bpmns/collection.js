import { Class } from "meteor/jagi:astronomy";
export const BpmnCollection = new Mongo.Collection("bpmns");

export default Class.create({
  name: "Bpmn",
  collection: BpmnCollection,
  fields: {
    value: {
      type: String,
      default: "",
    },
    userId: {
      type: String,
      default: "",
    },
    label: {
      type: String,
      default: "",
      label: "名称",
    },
    description: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "",
    },
    createdAt: {
      type: Date,
      default: () => new Date(),
    },
    updatedAt: {
      type: Date,
      default: () => new Date(),
    },
    createdBy: {
      type: String,
      default: "",
    },
    scope: {
      type: String,
      default: "",
    },
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
