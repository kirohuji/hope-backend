import {
  Message,
  Conversation,
  ConversationsCollection,
  ParticipantsCollection,
} from "meteor/socialize:messaging";
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
Message.attachSchema({
  contentType: {
    type: String,
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
});
