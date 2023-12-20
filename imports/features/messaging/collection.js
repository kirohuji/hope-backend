import { Message, Conversation, ConversationsCollection, ParticipantsCollection } from 'meteor/socialize:messaging';
ConversationsCollection._hookAspects.insert.after = []
ConversationsCollection.after.insert(function afterInsert (userId, document) {
    ParticipantsCollection.insert({ conversationId: document._id, read: true }, {
        extendAutoValueContext: {
            userId: userId
        }
    });
})

Message.attachSchema({
    contentType: {
        type: String,
        required: false,
    }
})
Conversation.attachSchema({
    isRemove: {
        type: Boolean,
        required: false,
    }
})
