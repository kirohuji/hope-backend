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
Conversation.attachSchema({
  sessionId: {
    type: String,
    required: false,
  },
  label: {
    type: String,
    required: false,
  },
})
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
