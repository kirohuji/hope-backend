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
});
