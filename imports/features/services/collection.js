import { Class } from "meteor/jagi:astronomy";
export const ServiceCollection = new Mongo.Collection("services");

export default Class.create({
  name: "Service",
  collection: ServiceCollection,
  fields: {
    value: {
      type: String,
      default: "",
    },
    label: {
      type: String,
      default: "",
      label: "名称",
    },
    // 是否发布
    published: {
      type: Boolean,
      default: false,
    },
    // 负责人
    leaders: {
      type: [String],
      default: [],
    },
    // 照片集
    images: {
      type: [Object],
      default: "",
    },
    // 内容
    content: {
      type: String,
      default: "",
    },
    // 时间长度
    durations: {
      type: String,
      default: "",
    },
    // 目的地
    destination: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      default: "",
    },
    scope: {
      type: String,
      default: "",
    },
    createdBy: {
      type: String,
      default: "",
    },
    modifiedDate: {
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
  },
});
