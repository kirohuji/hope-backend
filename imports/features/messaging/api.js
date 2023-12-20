import Api from "../../api";
import _ from 'lodash'
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
  lastMessage,
  lastMessageByLastId,
  sendMessage,
  createNewConversations,
  getConversationsByCurrentUser,
  getConversations,
  updateReadState,
  addParticipants,
  addParticipant,
  removeParticipant,
  participants,
  participantsAsUsers,
  conversationByParticipantId,
  userByParticipantId,
  numUnreadConversations,
  numUnreadConversationsByCurrentUser,
  isParticipatingInByCurrentUser,
  isParticipatingIn,
  softRemoveConversation
} from './service';
import { serverError500 } from "../base/api";

Api.addRoute('messaging/conversations/:_id', {
  delete: {
    authRequired: true,
    action: function () {
      try {
        return removeConversations(this.urlParams._id);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message
        })
      }
    }
  },
  get: {
    authRequired: true,
    action: function () {
      try {
        return getConversationsById(this.urlParams._id);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message
        })
      }
    }
  }
});

Api.addRoute('messaging/unreadConversations', {
  post: {
    authRequired: true,
    action: function () {
      try {
        return unreadConversations({
          user: this.user,
          bodyParams: this.bodyParams
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message
        })
      }
    }
  }
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
          message: e.message
        })
      }
    }
  }
});

Api.addRoute('messaging/isObserving/:_id', {
  get: {
    authRequired: true,
    action: function () {
      try {
        return isObserving({
          user: this.user,
          _id: this.urlParams._id
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message
        })
      }
    }
  }
});

Api.addRoute('messaging/findExistingConversationWithUsers', {
  post: {
    authRequired: true,
    action: function () {
      try {
        return findExistingConversationWithUsers({
          userId: this.userId,
          users: this.bodyParams.users
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message
        })
      }
    }
  }
});

Api.addRoute('messaging/conversations/:_id/isUnread', {
  post: {
    authRequired: true,
    action: function () {
      try {
        return isUnread({
          conversationId: this.urlParams._id,
          userId: this.userId
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message
        })
      }
    }
  }
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
          message: e.message
        })
      }
    }
  }
});

Api.addRoute('messaging/conversations/:_id/messages', {
  post: {
    authRequired: true,
    action: function () {
      try {
        return messages({
          conversationId: this.urlParams._id,
          bodyParams: this.bodyParams
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message
        })
      }
    }
  }
});

Api.addRoute('messaging/conversations/:_id/lastMessage', {
  get: {
    authRequired: true,
    action: function () {
      try {
        return lastMessage(this.urlParams._id);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message
        })
      }
    }
  }
});

Api.addRoute('messaging/conversations/:_id/lastMessage/:lastId', {
  get: {
    authRequired: true,
    action: function () {
      try {
        return lastMessageByLastId({
          lastId: this.urlParams.lastId,
          conversationId: this.urlParams._id,
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message
        })
      }
    }
  }
});

Api.addRoute('messaging/conversations/:_id/sendMessage', {
  post: {
    authRequired: true,
    action: function () {
      try {
        return sendMessage({
          conversationId: this.urlParams._id,
          userId: this.userId,
          bodyParams: this.bodyParams
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message
        })
      }
    }
  }
});

Api.addRoute('messaging/conversations/room', {
  post: {
    authRequired: true,
    action: function () {
      try {
        return createNewConversations({
          participants: this.bodyParams.participants,
          userId: this.userId,
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message
        })
      }
    }
  }
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
          message: e.message
        })
      }
    }
  }
});

Api.addRoute('messaging/conversations/:_id/updateReadState/:_status', {
  get: {
    authRequired: true,
    action: function () {
      try {
        return updateReadState({
          conversationId:  this.urlParams._id,
          status: this.urlParams._status
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message
        })
      }
    }
  }
});

Api.addRoute('messaging/conversations/:_id/addParticipants', {
  post: {
    authRequired: true,
    action: function () {
      try {
        return addParticipants({
          conversationId:  this.urlParams._id,
          participants:  this.bodyParams.participants
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message
        })
      }
    }
  }
});

Api.addRoute('messaging/conversations/:_id/addParticipant', {
  post: {
    authRequired: true,
    action: function () {
      try {
        return addParticipant({
          conversationId:  this.urlParams._id,
          participant:  this.bodyParams.participant
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message
        })
      }
    }
  }
});

Api.addRoute('messaging/conversations/:_id/removeParticipant', {
  post: {
    authRequired: true,
    action: function () {
      try {
        return removeParticipant({
          conversationId:  this.urlParams._id,
          participant:  this.bodyParams.participant
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message
        })
      }
    }
  }
});

Api.addRoute('messaging/conversations/:_id/participants', {
  get: {
    authRequired: true,
    action: function () {
      try {
        return participants(this.urlParams._id,);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message
        })
      }
    }
  }
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
          message: e.message
        })
      }
    }
  }
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
          message: e.message
        })
      }
    }
  }
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
          message: e.message
        })
      }
    }
  }
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
          message: e.message
        })
      }
    }
  }
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
          message: e.message
        })
      }
    }
  }
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
          message: e.message
        })
      }
    }
  }
});

Api.addRoute('messaging/conversations/:_id/isParticipatingIn', {
  get: {
    authRequired: true,
    action: function () {
      try {
        return isParticipatingInByCurrentUser({
          participantId: this.urlParams._id,
          user: this.user
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message
        })
      }
    }
  }
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
          message: e.message
        })
      }
    }
  }
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
          message: e.message
        })
      }
    }
  }
});

const optionsArgumentCheck = {
  limit: Match.Optional(Number),
  skip: Match.Optional(Number),
  sort: Match.Optional(Object),
};

Meteor.publish('socialize.messagesFor2', function publishMessageFor (conversationId, userId, date, options = { limit: 5, sort: { createdAt: -1 } }) {
  // check(conversationId, String);
  // check(options, optionsArgumentCheck);
  if (conversationId) {
    const user = Meteor.users.findOne({
      _id: userId
    })
    if (user?.isParticipatingIn(conversationId)) {
      return MessagesCollection.find({
        conversationId: conversationId,
        createdAt: {
          $gte: date
        }
      }, options)
    }
  }
});


publishComposite('socialize.conversations2', function publishConversations (userId, options = { limit: 10, sort: { updatedAt: -1 } }) {
  check(options, optionsArgumentCheck);
  if (!userId) {
    return this.ready();
  }

  return {
    find () {
      return ParticipantsCollection.find({ userId: userId, deleted: { $exists: false } }, options);
    },
    children: [
      {
        find (participant) {
          return ConversationsCollection.find({ _id: participant.conversationId })
        },
        children: [
          {
            find (conversation) {
              return conversation.participants();
            },
            children: [
              {
                find (participant) {
                  return Meteor.users.find({ _id: participant.userId }, { fields: User.fieldsToPublish });
                },
              },
              {
                find (participant) {
                  return ProfilesCollection.find({ _id: participant.userId }, { fields: User.fieldsToPublish });
                },
              },
            ],
          },
          {
            find (conversation) {
              return conversation.messages({ limit: 1, sort: { createdAt: -1 } });
            },
          },
        ],
      },
    ],
  };
});
