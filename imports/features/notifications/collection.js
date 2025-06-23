import { Class } from "meteor/jagi:astronomy";
export const NotificationCollection = new Mongo.Collection("notifications");
export const NotificationUserCollection = new Mongo.Collection(
  "notifications_users"
);
Meteor.notifications = NotificationCollection;
Meteor.notificationsUsers = NotificationUserCollection;

export const NotificationUser = Class.create({
  name: "NotificationUser",
  collection: NotificationUserCollection,
  fields: {
    userId: Mongo.ObjectID,
    isRemove: Boolean,
    isUnRead: Boolean,
    notificationId: Mongo.ObjectID,
  },
});

export default Class.create({
  name: "Notification",
  collection: NotificationCollection,
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
    scope: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      default: "article",
    },
    status: {
      type: String,
      allowedValues: [
        "pending",
        "published"
      ],
      default: "pending",
    },
    category: {
      type: String,
      default: "Training",
    },
    createdAt: {
      type: String,
      default: "2023/10/23",
    },
    createdBy: {
      type: String,
      default: "2023/10/23",
    },
    publisherId: {
      type: String,
      default: "",
    },
    sendingTiming: {
      type: String,
      default: "",
    },
    title: {
      type: String,
      default: "<p>打卡成功</p>",
    },
    isBroadcast: {
      type: Boolean,
      default: false,
    },
    isRemove: {
      type: Boolean,
      default: "<p>打卡成功</p>",
    },
    fileId: {
      type: String,
      default: "",
    },
    sourceId: {
      type: String,
      default: "",
    },
    sourceType: {
      type: String,
      default: "",
    },
  },
});
