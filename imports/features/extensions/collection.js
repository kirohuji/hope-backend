import { Class } from "meteor/jagi:astronomy";
export const ExtensionCollection = new Mongo.Collection("extensions");
export const ExtensionUserCollection = new Mongo.Collection("extensions_users");

export const ExtensionUser = Class.create({
  name: "ExtensionUser",
  collection: ExtensionCollection,
  fields: {
    article_id: Mongo.ObjectID,
    user_id: Mongo.ObjectID,
    answers: [String],
    completedDate: String,
  },
});
export default Class.create({
  name: "Extension",
  collection: ExtensionCollection,
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
    }
  },
});
