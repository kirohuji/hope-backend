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
    type: {
      type: String,
      default: "article",
    },
    category: {
      type: String,
      default: "Training",
    },
    createdAt: {
      type: String,
      default: "2023/10/23",
    },
    publisherId: {
      type: String,
      default: "",
    },
    title: {
      type: String,
      default: "<p>打卡成功</p>",
    },
    isRemove: {
      type: Boolean,
      default: "<p>打卡成功</p>",
    },
    fileId: {
      type: String,
      default: "",
    },
  },
});
