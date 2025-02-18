import {
  Message,
  Conversation,
  ConversationsCollection,
  ParticipantsCollection,
} from "meteor/socialize:messaging";

export const PushNotificationTokenCollection = new Mongo.Collection(
  "push_notification_token"
);
Meteor.methods({
  savePushNotificationToken(token) {
    check(token, String);

    // 获取当前登录用户的 userId
    const userId = this.userId;

    if (!userId) {
      throw new Meteor.Error("not-authorized");
    }

    // 插入或更新 FCM token 到数据库
    FCMTokenCollection.upsert(
      { userId }, // 使用 userId 作为唯一标识符
      { $set: { token, updatedAt: new Date() } } // 更新 token 和更新时间
    );
  },
});
ConversationsCollection._hookAspects.insert.after = [];
ConversationsCollection.after.insert(function afterInsert(userId, document) {
  ParticipantsCollection.insert(
    { conversationId: document._id, read: true },
    {
      extendAutoValueContext: {
        userId: userId,
      },
    }
  );
});

Conversation.attachSchema({
  sessionId: {
    type: String,
    required: false,
  },
  label: {
    type: String,
    required: false,
  },
});
Message.attachSchema({
  contentType: {
    type: String,
    required: false,
  },
  isGenerate: {
    type: Boolean,
    required: false,
  },
  sendingMessageId: {
    type: String,
    required: false,
  },
  readedIds: {
    type: Array,
    optional: true,
  },
  "readedIds.$": {
    type: String,
  },
  attachments: {
    type: Array,
    optional: true,
  },
  "attachments.$": {
    type: Object,
  },
  "attachments.$.name": {
    type: String,
  },
  "attachments.$.preview": {
    type: String,
  },
  "attachments.$.createdAt": {
    type: String,
  },
  "attachments.$.type": {
    type: String,
  },
});
Conversation.attachSchema({
  isRemove: {
    type: Boolean,
    required: false,
  },
  createdBy: {
    type: String,
    required: false,
  },
});
