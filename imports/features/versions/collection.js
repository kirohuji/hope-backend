import { Class } from "meteor/jagi:astronomy";
export const VersionCollection = new Mongo.Collection("versions");

export default Class.create({
  name: "Version",
  collection: VersionCollection,
  fields: {
    createdBy: {
      type: String,
      default: "",
      optional: true,
    },
    label: {
      type: String,
      default: "",
      optional: true,
    },
    value: {
      type: String,
      default: "",
      optional: true,
    },
    majorVersion: {
      type: String,
      default: "",
      optional: true,
    },
    minorVersion: {
      type: String,
      default: "",
      optional: true,
    },
    patchVersion: {
      type: String,
      default: "",
      optional: true,
    },
    isMandatory: {
      type: String,
      default: "",
      optional: true,
    },
    releaseDate: {
      type: String,
      default: "",
      optional: true,
    },
    description: {
      type: String,
      default: "",
      optional: true,
    },
    file: {
      type: String,
      default: "",
      optional: true,
    },
    isActive: {
      type: Boolean,
      default: "",
      optional: true,
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
