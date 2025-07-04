import Api from "../../api";
import _ from "lodash";
import {
  ConversationsCollection,
  MessagesCollection,
} from "meteor/socialize:messaging";
import {
  handleConversationDelete,
  handleConversationUpdate,
  handleGetConversationById,
  handleUnreadConversations,
  handleNewestConversation,
  handleIsObserving,
  handleFindExistingConversation,
  handleIsUnread,
  handleIsReadOnly,
  handleGetMessages,
  handleGetMessagesWithDate,
  handleGetAttachments,
  handleGetLastMessage,
  handleGetLastMessageByLastId,
  handleSendMessage,
  handleSavePushToken,
  handleUpdateDeviceStatus,
  handleCreateConversation,
  handleGetConversationsByParticipantIds,
  handleGetConversationsByCurrentUser,
  handleUpdateReadState,
  handleAddParticipants,
  handleRemoveParticipants,
  handleAddParticipant,
  handleRemoveParticipant,
  handleGetParticipants,
  handleGetParticipantsAsUsers,
  handleGetConversationByParticipantId,
  handleGetUserByParticipantId,
  handleGetNumUnreadConversationsByCurrentUser,
  handleGetNumUnreadConversations,
  handleGetConversations,
  handleIsParticipatingInByCurrentUser,
  handleIsParticipatingIn,
  handleSoftRemoveConversation,
  sendHuaweiPush
} from "./service";
import { serverError500 } from "../base/api";

Api.addRoute("messaging/conversations/:_id", {
  delete: {
    authRequired: true,
    action: function () {
      try {
        return handleConversationDelete(this.urlParams._id);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
  patch: {
    authRequired: true,
    action: function () {
      try {
        return handleConversationUpdate({
          conversationId: this.urlParams._id,
          ...this.bodyParams,
        });
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
        return handleGetConversationById({
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

Api.addRoute("messaging/unreadConversations", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return handleUnreadConversations({
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

Api.addRoute("messaging/newestConversation", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return handleNewestConversation({
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

Api.addRoute("messaging/isObserving/:_id", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return handleIsObserving({
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

Api.addRoute("messaging/findExistingConversationWithUsers", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return handleFindExistingConversation({
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

Api.addRoute("messaging/conversations/:_id/isUnread", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return handleIsUnread({
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

Api.addRoute("messaging/conversations/:_id/isReadOnly", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return handleIsReadOnly(this.urlParams._id);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("messaging/conversations/:_id/messages", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return handleGetMessages({
          userId: this.userId,
          conversationId: this.urlParams._id,
          bodyParams: {
            ...this.bodyParams,
            deleteIds: {
              $nin: [this.userId],
            }
          },
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

Api.addRoute("messaging/conversations/:_id/messages/date", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return handleGetMessagesWithDate({
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

Api.addRoute("messaging/conversations/:_id/messages/attachments", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return handleGetAttachments(this.urlParams._id);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("messaging/conversations/:_id/lastMessage", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return handleGetLastMessage(this.urlParams._id || this.bodyParams.id);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("messaging/conversations/:_id/lastMessage/:lastId", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return handleGetLastMessageByLastId({
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

Api.addRoute("messaging/conversations/:_id/sendMessage", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return handleSendMessage({
          conversationId: this.urlParams._id,
          userId: this.userId,
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

Api.addRoute("messaging/conversations/savePushNotificationToken", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return handleSavePushToken({
          userId: this.userId,
          token: this.bodyParams.token,
          device: this.bodyParams.device,
          deviceId: this.bodyParams.deviceId,
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

Api.addRoute("messaging/conversations/updateDeviceStatus", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return handleUpdateDeviceStatus({
          userId: this.userId,
          status: this.bodyParams.status,
          deviceId: this.bodyParams.deviceId,
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

Api.addRoute("messaging/test", {
  post: {
    authRequired: false,
    action: function () {
      try {
        return sendHuaweiPush(
          "KAAAAACy1InRAAB7dNSVW3S6ZZBNwC8MFjY_jgdLUmq0dTp1Nun1-FeBm9in0XiupfSuSctn4_MZUW0V2TQrBSGwDUHT0KKaJ85sqDNSYhWdKYubiA",
          "收到了吗?"
        );
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("messaging/conversations/room", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return handleCreateConversation({
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

Api.addRoute("messaging/users/conversations/participants", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return handleGetConversationsByParticipantIds({
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

Api.addRoute("messaging/users/conversations", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return handleGetConversationsByCurrentUser(this.user);
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
        return handleGetConversationsByCurrentUser(this.user, this.bodyParams.ids);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("messaging/conversations/:_id/updateReadState/:_status", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return handleUpdateReadState({
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

Api.addRoute("messaging/conversations/:_id/addParticipants", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return handleAddParticipants({
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

Api.addRoute("messaging/conversations/:_id/removeParticipants", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return handleRemoveParticipants({
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

Api.addRoute("messaging/conversations/:_id/addParticipant", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return handleAddParticipant({
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

Api.addRoute("messaging/conversations/:_id/removeParticipant", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return handleRemoveParticipant({
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

Api.addRoute("messaging/conversations/:_id/participants", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return handleGetParticipants(this.urlParams._id);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("messaging/conversations/:_id/participantsAsUsers", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return handleGetParticipantsAsUsers(this.urlParams._id);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("messaging/participants/conversation/:_id", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return handleGetConversationByParticipantId(this.urlParams._id);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("messaging/participants/user/:_id", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return handleGetUserByParticipantId(this.urlParams._id);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("messaging/users/numUnreadConversations", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return handleGetNumUnreadConversationsByCurrentUser(this.user);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("messaging/users/numUnreadConversations/:_id", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return handleGetNumUnreadConversations(this.urlParams._id);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("messaging/users/conversations/:_id", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return handleGetConversations(this.urlParams._id);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("messaging/conversations/:_id/isParticipatingIn", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return handleIsParticipatingInByCurrentUser({
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

Api.addRoute("messaging/conversations/:_id/isParticipatingIn/:_userId", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return handleIsParticipatingIn({
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

Api.addRoute("messaging/conversations/delete/:_id", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return handleSoftRemoveConversation(this.urlParams._id, this.userId);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Meteor.publish(
  "socialize.messagesFor2",
  function publishMessageFor(
    conversationId,
    userId,
    date,
    options = { limit: 100, sort: { createdAt: -1 } }
  ) {
    if (conversationId) {
      const user = Meteor.users.findOne({
        _id: userId,
      });
      if (user?.isParticipatingIn(conversationId)) {
        return MessagesCollection.find(
          {
            conversationId: conversationId,
            userId: {
              $ne: userId,
            },
            createdAt: {
              $gte: date,
            },
            deleteIds: {
              $nin: [userId],
            },
          },
          {
            ...options,
            fields: { readedIds: 0 },
          }
        );
      }
    }
  }
);

Meteor.publish("socialize.unreadCount", function publishMessageFor(userId) {
  if (userId) {
    let conversations = ConversationsCollection.find({
      $or: [{ isRemove: false }, { isRemove: { $exists: false } }],
      _participants: {
        $in: [userId],
      },
    });
    return conversations.map((item) => {
      return {
        conversationId: item._id,
        unreadCount: MessagesCollection.find({
          conversationId: item._id,
          deleteIds: {
            $nin: [userId],
          },
          readedIds: {
            $nin: [user._id],
          },
        }).count(),
      };
    });
  }
});

Meteor.publish("newMessagesConversations", function (date) {
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
    { fields: { readedIds: 0 } }
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
        $or: [{ isRemove: false }, { isRemove: { $exists: false } }],
        $or: [{ sessionId: { $exists: false } }],
        _id: updatedConversationId,
        _participants: {
          $in: [this.userId],
        },
      },
      { fields: { unreadCount: 0, readedIds: 0 } }
    );
  } else {
    return ConversationsCollection.find(
      {
        $or: [{ isRemove: false }, { isRemove: { $exists: false } }],
        $or: [{ sessionId: { $exists: false } }],
        _participants: {
          $in: [this.userId],
        },
      },
      { fields: { unreadCount: 0, readedIds: 0 } }
    );
  }
});
