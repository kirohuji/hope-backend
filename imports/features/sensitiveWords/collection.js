import { Class } from "meteor/jagi:astronomy";
export const SensitiveWordsCollection = new Mongo.Collection("sensitive_words");

export default Class.create({
  name: "SensitiveWord",
  collection: SensitiveWordsCollection, // 定义敏感词数据表
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
    description: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      allowedValues: ["active", "inactive"],
      default: "active", // 默认启用
    },
    category: {
      type: String,
      allowedValues: ["2", "3", "4", "5", "6", "7", "8"],
      required: true,
    },
    replacement: {
      type: String,
      optional: true, // 备注原因
    },
    level: {
      type: String,
      allowedValues: ["1", "2", "3", "4", "5"], // 1-5级敏感度
      required: true,
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
