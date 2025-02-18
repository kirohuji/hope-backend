import { Class } from "meteor/jagi:astronomy";
export const BroadcastCollection = new Mongo.Collection("broadcasts");
export const BroadcastUserCollection = new Mongo.Collection("broadcasts_users");

export const BroadcastUser = Class.create({
  name: "BroadcastUser",
  collection: BroadcastUserCollection,
  fields: {
    user_id: String,
    broadcast_id: String,
    status: {
      type: String,
      default: "signOut",
    },
  },
});

// 有效期限
const Available = Class.create({
  name: "Available",
  /* No collection attribute */
  fields: {
    startDate: {
      type: String,
    },
    endDate: {
      type: String,
    },
  },
});

export default Class.create({
  name: "Broadcast",
  collection: BroadcastCollection,
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
    // 有效期限
    available: {
      type: Available,
      default: "",
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
