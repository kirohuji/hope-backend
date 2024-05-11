import { Class } from "meteor/jagi:astronomy";
export const AiModelsCollection = new Mongo.Collection("ai_models");
export default Class.create({
  name: "AiModels",
  collection: AiModelsCollection,
  fields: {
    value: {
      type: String,
      default: "",
    },
    label: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    createdBy: {
      type: String,
      default: "",
    },
    published: {
      type: Boolean,
      default: true,
    },
  },
  behaviors: {
    timestamp: {
      hasCreatedField: true,
      createdFieldName: "createdAt",
      hasUpdatedField: true,
      updatedFieldName: "updatedAt",
    },
  },
});
