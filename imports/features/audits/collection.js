import { Class } from "meteor/jagi:astronomy";
export const AuditCollection = new Mongo.Collection("audits");
export const AuditUserCollection = new Mongo.Collection("audits_users");

export default Class.create({
  name: "Audit",
  collection: AuditCollection,
  fields: {
    value: {
      type: String,
      default: "",
    },
    sourceId: {
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
    status: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "",
    },
    result: {
      type: String,
      default: "",
    },
    reason: {
      type: String,
      default: "",
    },
    reviewerId: {
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
