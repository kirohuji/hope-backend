import { Class } from "meteor/jagi:astronomy";
export const TagCollection = new Mongo.Collection("tags");
export default Class.create({
  name: "Tag",
  collection: TagCollection,
  fields: {
    value: {
      type: String,
      default: "",
    },
    name: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      default: "",
    },
    group: {
      type: String,
      default: "",
    },
  },
});
