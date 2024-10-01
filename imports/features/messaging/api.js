import Api from '../../api';
import _ from 'lodash';
import {
  ConversationsCollection,
  ParticipantsCollection,
  MessagesCollection,
} from 'meteor/socialize:messaging';
import { ProfilesCollection } from 'meteor/socialize:user-profile';
import { publishComposite } from 'meteor/reywood:publish-composite';
import { User } from 'meteor/socialize:user-model';
import {
  removeConversations,
  findExistingConversationWithUsers,
  isObserving,
  getConversationsById,
  newestConversation,
  unreadConversations,
  isUnread,
  isReadOnly,
  messages,
  messagesWithDate,
  attachments,
  lastMessage,
  lastMessageByLastId,
  sendMessage,
  savePushNotificationToken,
  createNewConversations,
  getConversationsByCurrentUser,
  getConversations,
  getConversationsByParticipantIds,
  updateReadState,
  addParticipants,
  addParticipant,
  removeParticipant,
  removeParticipants,
  participants,
  participantsAsUsers,
  conversationByParticipantId,
  userByParticipantId,
  numUnreadConversations,
  numUnreadConversationsByCurrentUser,
  isParticipatingInByCurrentUser,
  isParticipatingIn,
  softRemoveConversation,
} from './service';
import { serverError500 } from '../base/api';

Api.addRoute('messaging/conversations/:_id', {
  delete: {
    authRequired: true,
    action: function () {
      try {
        return removeConversations(this.urlParams._id);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
  get: {
    authRequired: true,
    action: function () {
      try {
        return getConversationsById({
          conversationId: this.urlParams._id,
          userId: this.userId,
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute('messaging/unreadConversations', {
  post: {
    authRequired: true,
    action: function () {
      try {
        return unreadConversations({
          user: this.user,
          bodyParams: this.bodyParams,
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute('messaging/newestConversation', {
  get: {
    authRequired: true,
    action: function () {
      try {
        return newestConversation({
          user: this.user,
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute('messaging/isObserving/:_id', {
  get: {
    authRequired: true,
    action: function () {
      try {
        return isObserving({
          user: this.user,
          _id: this.urlParams._id,
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute('messaging/findExistingConversationWithUsers', {
  post: {
    authRequired: true,
    action: function () {
      try {
        return findExistingConversationWithUsers({
          userId: this.userId,
          users: this.bodyParams.users,
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute('messaging/conversations/:_id/isUnread', {
  post: {
    authRequired: true,
    action: function () {
      try {
        return isUnread({
          conversationId: this.urlParams._id,
          userId: this.userId,
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute('messaging/conversations/:_id/isReadOnly', {
  get: {
    authRequired: true,
    action: function () {
      try {
        return isReadOnly(this.urlParams._id);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute('messaging/conversations/:_id/messages', {
  post: {
    authRequired: true,
    action: function () {
      try {
        return messages({
          userId: this.userId,
          conversationId: this.urlParams._id,
          bodyParams: this.bodyParams,
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute('messaging/conversations/:_id/messages/date', {
  post: {
    authRequired: true,
    action: function () {
      try {
        return messagesWithDate({
          date: this.bodyParams.date,
          userId: this.userId,
          conversationId: this.urlParams._id,
          bodyParams: this.bodyParams,
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute('messaging/conversations/:_id/messages/attachments', {
  post: {
    authRequired: true,
    action: function () {
      try {
        return attachments({
          conversationId: this.urlParams._id,
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute('messaging/conversations/:_id/lastMessage', {
  get: {
    authRequired: true,
    action: function () {
      try {
        const message =  lastMessage(this.urlParams._id);
        return {
          ...message,
          user: ProfilesCollection.findOne({ _id: message.userId })
        }
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute('messaging/conversations/:_id/lastMessage/:lastId', {
  get: {
    authRequired: true,
    action: function () {
      try {
        return lastMessageByLastId({
          userId: this.userId,
          lastId: this.urlParams.lastId,
          conversationId: this.urlParams._id,
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute('messaging/conversations/:_id/sendMessage', {
  post: {
    authRequired: true,
    action: function () {
      try {
        let messageId =  sendMessage({
          conversationId: this.urlParams._id,
          userId: this.userId,
          bodyParams: this.bodyParams,
        });
        if(messageId){
          const message = MessagesCollection.findOne({
            _id: messageId
          })
          return {
            ...message,
            senderId: message.userId
          }
        }
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute('messaging/conversations/savePushNotificationToken', {
  post: {
    authRequired: true,
    action: function () {
      try {
        return savePushNotificationToken({
          userId: this.userId,
          token: this.bodyParams.token,
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute('messaging/conversations/room', {
  post: {
    authRequired: true,
    action: function () {
      try {
        return createNewConversations({
          participants: this.bodyParams.participants,
          sessionId: this.bodyParams.sessionId,
          isSession: this.bodyParams.isSession,
          userId: this.userId,
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});
Api.addRoute('messaging/users/conversations/participants', {
  post: {
    authRequired: true,
    action: function () {
      try {
        return getConversationsByParticipantIds({
          participants: this.bodyParams.participants,
          userId: this.userId,
          isSession: this.bodyParams.isSession,
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute('messaging/users/conversations', {
  get: {
    authRequired: true,
    action: function () {
      try {
        return getConversationsByCurrentUser(this.user);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
  post: {
    authRequired: true,
    action: function () {
      try {
        return getConversationsByCurrentUser(this.user, this.bodyParams.ids);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute('messaging/conversations/:_id/updateReadState/:_status', {
  get: {
    authRequired: true,
    action: function () {
      try {
        return updateReadState({
          conversationId: this.urlParams._id,
          status: this.urlParams._status,
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute('messaging/conversations/:_id/addParticipants', {
  post: {
    authRequired: true,
    action: function () {
      try {
        return addParticipants({
          conversationId: this.urlParams._id,
          participants: this.bodyParams.participants,
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute('messaging/conversations/:_id/removeParticipants', {
  post: {
    authRequired: true,
    action: function () {
      try {
        return removeParticipants({
          conversationId: this.urlParams._id,
          participants: this.bodyParams.participants,
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute('messaging/conversations/:_id/addParticipant', {
  post: {
    authRequired: true,
    action: function () {
      try {
        return addParticipant({
          conversationId: this.urlParams._id,
          participant: this.bodyParams.participant,
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute('messaging/conversations/:_id/removeParticipant', {
  post: {
    authRequired: true,
    action: function () {
      try {
        return removeParticipant({
          conversationId: this.urlParams._id,
          participant: this.bodyParams.participant,
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute('messaging/conversations/:_id/participants', {
  get: {
    authRequired: true,
    action: function () {
      try {
        return participants(this.urlParams._id);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute('messaging/conversations/:_id/participantsAsUsers', {
  get: {
    authRequired: true,
    action: function () {
      try {
        return participantsAsUsers(this.urlParams._id);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute('messaging/participants/conversation/:_id', {
  get: {
    authRequired: true,
    action: function () {
      try {
        return conversationByParticipantId(this.urlParams._id);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute('messaging/participants/user/:_id', {
  get: {
    authRequired: true,
    action: function () {
      try {
        return userByParticipantId(this.urlParams._id);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute('messaging/users/numUnreadConversations', {
  get: {
    authRequired: true,
    action: function () {
      try {
        return numUnreadConversationsByCurrentUser(this.user);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute('messaging/users/numUnreadConversations/:_id', {
  get: {
    authRequired: true,
    action: function () {
      try {
        return numUnreadConversations(this.urlParams._id);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute('messaging/users/conversations/:_id', {
  get: {
    authRequired: true,
    action: function () {
      try {
        return getConversations(this.urlParams._id);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute('messaging/conversations/:_id/isParticipatingIn', {
  get: {
    authRequired: true,
    action: function () {
      try {
        return isParticipatingInByCurrentUser({
          participantId: this.urlParams._id,
          user: this.user,
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute('messaging/conversations/:_id/isParticipatingIn/:_userId', {
  get: {
    authRequired: true,
    action: function () {
      try {
        return isParticipatingIn({
          participantId: this.urlParams._id,
          user: this.urlParams._userId,
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute('messaging/conversations/delete/:_id', {
  post: {
    authRequired: true,
    action: function () {
      try {
        return softRemoveConversation(this.urlParams._id);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

const optionsArgumentCheck = {
  limit: Match.Optional(Number),
  skip: Match.Optional(Number),
  sort: Match.Optional(Object),
};

Meteor.publish(
  'socialize.messagesFor2',
  function publishMessageFor(
    conversationId,
    userId,
    date,
    options = { limit: 100, sort: { createdAt: -1 } },
  ) {
    if (conversationId) {
      const user = Meteor.users.findOne({
        _id: userId,
      });
      if (user?.isParticipatingIn(conversationId)) {
        console.log('1')
        return MessagesCollection.find(
          {
            conversationId: conversationId,
            createdAt: {
              $gte: date,
            },
          },
          {
            ...options,
            fields: { readedIds: 0 },
          },
        );
      }
    }
  },
);

Meteor.publish('socialize.unreadCount', function publishMessageFor(userId) {
  if (userId) {
    let conversations = ConversationsCollection.find({
      isRemove: false,
      _participants: {
        $in: [userId],
      },
    });
    return conversations.map(item => {
      return {
        conversationId: item._id,
        unreadCount: MessagesCollection.find({
          conversationId: item._id,
          readedIds: {
            $nin: [user._id],
          },
        }).count(),
      };
    });
  }
});

Meteor.publish('newMessagesConversations', function (date) {
  if (!this.userId) {
    return this.ready();
  }

  let updatedConversationId = null; // 存储更新的会话ID

  const observer = MessagesCollection.find(
    {
      createdAt: {
        $gte: date,
      },
    },
    { fields: { readedIds: 0 } },
  ).observeChanges({
    added: (id, fields) => {
      // 仅在更新的会话ID为空时，才将其设置为第一个新增消息所属的会话ID
      if (!updatedConversationId) {
        updatedConversationId = fields.conversationId;
      }
      // 否则，如果更新的会话ID已经存在，则不作处理
    },
  });

  this.onStop(() => {
    observer.stop();
  });

  // 如果存在更新的会话ID，则返回该会话的发布，否则返回所有会话的发布
  if (updatedConversationId) {
    return ConversationsCollection.find(
      {
        isRemove: false,
        _id: updatedConversationId,
        _participants: {
          $in: [this.userId],
        },
      },
      { fields: { unreadCount: 0,readedIds: 0 } },
    );
  } else {
    return ConversationsCollection.find(
      {
        isRemove: false,
        _participants: {
          $in: [this.userId],
        },
      },
      { fields: { unreadCount: 0,readedIds: 0 } },
    );
  }
});
