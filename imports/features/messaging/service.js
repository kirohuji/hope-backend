import {
  Conversation,
  ConversationsCollection,
  ParticipantsCollection,
  Message,
  MessagesCollection,
} from 'meteor/socialize:messaging';
import apn from 'apn';
import { UserPresence } from 'meteor/socialize:user-presence';
import ServerPresence from 'meteor/socialize:server-presence';
import { ProfilesCollection } from 'meteor/socialize:user-profile';
import _ from 'lodash';
import { PushNotificationTokenCollection } from './collection';
import moment from 'moment';
const isDev = process.env.NODE_ENV !== 'production'; // 判断是否是开发环境
const firebaseAdmin = require('firebase-admin');
const serviceAccount = require('./hopehome-12650-firebase-adminsdk-ornad-b1abbd59c9.json');

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
});

const apnProvider = new apn.Provider({
  token: {
    key: isDev ? '/Users/lourd/Desktop/hope/hope-backend/AuthKey_F2J9GLB6LA.p8' : '/hope/AuthKey_F2J9GLB6LA.p8' , // APNs 密钥的路径
    keyId: 'F2J9GLB6LA', // Key ID
    teamId: '7JB945M6KZ', // Apple Developer Team ID
  },
  production: false, // 设置为 true 在生产环境中使用
});
export function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// 删除会话
export function removeConversations(conversationId) {
  return ConversationsCollection.remove({ _id: conversationId });
}

export function messageCountByConverstionId(conversationId) {
  const conversation = ConversationsCollection.findOne({ _id: conversationId });
  if (conversation) {
    const count = MessagesCollection.find({
      conversationId,
    }).count();
    return count <= 2;
  } else {
    return false;
  }
}
// 更新会话
export function updateConversations({ conversationId, label }) {
  const conversation = ConversationsCollection.findOne({ _id: conversationId });
  if (conversation) {
    return ConversationsCollection.update(
      {
        _id: conversation._id,
      },
      {
        $set: {
          label,
        },
      },
    );
  }
  return 0
}

// 获取会话信息
export function getConversationsById({ userId, conversationId }) {
  let conversation = ConversationsCollection.findOne({ _id: conversationId });
  if (!conversation) {
    throw new Error('不存在的会话!');
  }
  const unreadCount = MessagesCollection.find({
    conversationId,
    readedIds: {
      $nin: [userId],
    },
  }).count();
  return {
    ...conversation,
    messages: [],
    unreadCount,
    type: conversation?._participants.length > 2 ? 'GROUP' : 'ONE_TO_ONE',
    participants: ProfilesCollection.find({
      _id: { $in: conversation._participants },
    }).fetch(),
  };
}

// 未读的会话
export function unreadConversations({ user, bodyParams }) {
  return user.unreadConversations(bodyParams.options || {}).fetch();
}

// 最新会话
export function newestConversation({ user }) {
  return user.newestConversation();
}

// 是否在监控
export function isObserving({ user, _id }) {
  return user.isObserving(_id);
}

// 根据用户获取会话
export function findExistingConversationWithUsers({ userId, users }) {
  users.push(userId);
  let currentUsers = _.uniq(users);
  const conversation = ConversationsCollection.findOne({
    _participants: { $size: currentUsers.length, $all: currentUsers },
  });
  if (conversation) {
    ConversationsCollection.update(
      {
        _id: conversation._id,
      },
      {
        $set: {
          isRemove: false,
        },
      },
    );
  }
  return conversation ? conversation._id : -1;
}

// 当前用户是否未读
export function isUnread({ conversationId, userId }) {
  return !!ParticipantsCollection.findOne({
    conversationId,
    userId,
    read: false,
  });
}

// 会话是否只读
export function isReadOnly(conversationId) {
  return ConversationsCollection.findOne({ _id: conversationId }).isReadOnly();
}

// 获取会话的消息
export function messages({ userId, conversationId, bodyParams }) {
  let result = ConversationsCollection.findOne({ _id: conversationId })
    .messages(bodyParams.options || {})
    .map(item => {
      return {
        ...item,
        body: item.body,
        contentType: item.contentType || 'text',
        senderId: item.userId,
      };
    });
  MessagesCollection.update(
    {
      conversationId,
      _id: { $in: result.map(item => item._id) },
      readedIds: { $ne: userId },
    },
    {
      $addToSet: {
        readedIds: userId,
      },
    },
    { multi: true },
  );
  return result;
}

export function messagesWithDate({ date, conversationId, bodyParams }) {
  const dateTime = moment(date);
  const today = moment(dateTime).startOf('day');
  const tomorrow = moment(dateTime).endOf('day');
  let messages = MessagesCollection.find(
    {
      conversationId: conversationId,
      createdAt: {
        $gte: today.toDate(),
        $lt: tomorrow.toDate(),
      },
    },
    bodyParams.options,
  ).map(item => {
    return {
      ...item,
      body: item.body,
      contentType: item.contentType || 'text',
      senderId: item.userId,
    };
  });
  return messages;
}

// 获取会话的消息
export function attachments({ conversationId }) {
  return MessagesCollection.find({
    conversationId,
    attachments: { $exists: true, $elemMatch: { $exists: true } },
  }).map(item => item.attachments);
}

// 获取当前会话的最后一条消息
export function lastMessage(conversationId) {
  return ConversationsCollection.findOne({ _id: conversationId }).lastMessage();
}

// 根据消息获取当前会话的之后的消息
export function lastMessageByLastId({ userId, lastId, conversationId }) {
  let message = MessagesCollection.findOne({
    _id: lastId,
  });
  if (!message) {
    throw new Error('消息不存在');
  }

  let messagesIds = MessagesCollection.find({
    conversationId,
    createdAt: {
      $gte: message.createdAt,
    },
  }).map(msg => msg._id);
  let update = MessagesCollection.update(
    {
      _id: {
        $in: messagesIds,
      },
      readedIds: { $ne: userId },
    },
    {
      $addToSet: {
        readedIds: userId,
      },
    },
    { multi: true },
  );
  return MessagesCollection.find({
    conversationId,
    createdAt: {
      $gte: message.createdAt,
    },
  }).map(item => {
    return {
      ...item,
      body: item.body,
      contentType: item.contentType || 'text',
      senderId: item.userId,
    };
  });
}

export function updateMessage({ label, messageId, text }) {
  MessagesCollection.update(
    {
      _id: messageId,
    },
    {
      $set: {
        label: label,
        body: text,
      },
    },
  );
}

export function savePushNotificationToken({ userId, token, device, deviceId }) {
  check(token, String);
  // 插入或更新 FCM token 到数据库
  PushNotificationTokenCollection.upsert(
    { userId, deviceId: deviceId?.identifier }, // 使用 userId 和 deviceId 作为唯一标识符
    { $set: { token, updatedAt: new Date(), device, deviceId } }, // 更新 token 和更新时间
  );
}

function sendPushNotification({ contentType, body, conversationId }) {
  let userIds = ConversationsCollection.findOne({ _id: conversationId })
    .participantsAsUsers()
    .map(item => item._id);

  const userTokens = PushNotificationTokenCollection.find({
    userId: {
      $in: userIds,
    },
  }).fetch();
  if (userTokens && userTokens.length > 0) {
    userTokens.forEach(userToken => {
      if (
        Meteor.users.findOne({
          _id: userToken.userId,
          status: { $exists: false },
        })
      ) {
        const profile = ProfilesCollection.findOne({ _id: userToken.userId });
        const notification = new apn.Notification();
        notification.alert =
          contentType === 'text' ? body : '对方发送了一张图片给你';
        notification.title = profile.displayName;
        notification.launchImage = profile.photoURL;
        notification.badge = MessagesCollection.find({
          conversationId,
          readedIds: {
            $nin: [userToken.userId],
          },
        }).count();
        notification.topic = 'lourd.hope.app'; // iOS app 的 bundle id
        apnProvider
          .send(notification, userToken.token)
          .then(result => {
            console.log('APNs result:', result.failed[0].response);
          })
          .catch(error => {
            console.error('Error sending APNs notification:', error);
          });
        /** firebase */
      //   firebaseAdmin
      //     .messaging()
      //     .send({
      //       notification: {
      //         title: profile.displayName,
      //         body: contentType === 'text' ? body : '对方发送了一张图片给你',
      //       },
      //       token: userToken.token,
      //     })
      //     .then(response => {
      //       console.log('Successfully sent message:', response);
      //     })
      //     .catch(error => {
      //       console.log('Error sending message:', error);
      //     });
      }
    });
  }
}

// 发送消息
export function sendMessage({ conversationId, userId, bodyParams }) {
  const message = MessagesCollection.insert(
    new Message({
      conversationId,
      body: bodyParams.body,
      attachments: bodyParams.attachments,
      readedIds: [userId],
      sendingMessageId: bodyParams.sendingMessageId,
      contentType: bodyParams.contentType,
      inFlight: true,
      isGenerate: bodyParams.isGenerate,
    }),
    {
      extendAutoValueContext: {
        userId,
      },
    },
  );
  if (message) {
    sendPushNotification({
      body: bodyParams.body,
      contentType: bodyParams.contentType,
      conversationId,
    });
    return message;
  }
}

// 创建一个新会话
export function createNewConversations({
  isSession,
  sessionId,
  participants,
  userId,
}) {
  let conversation = null;
  if (!isSession) {
    if (sessionId) {
      conversation = ConversationsCollection.findOne({
        sessionId: sessionId,
      });
    } else {
      conversation = ConversationsCollection.findOne({
        _participants: {
          $all: _.uniq([...participants, userId]),
          $size: _.uniq([...participants, userId]).length
        },
      });
      console.log(conversation);
    }
  } else {
    if (sessionId) {
      conversation = ConversationsCollection.findOne({
        sessionId: sessionId,
      });
    }
  }
  if (conversation) {
    ConversationsCollection.update(
      {
        _id: conversation._id,
      },
      {
        $set: {
          isRemove: false,
        },
      },
    );
    return conversation;
  }
  CollectionHooks.defaultUserId = userId;
  let convo = new Conversation().save();
  if (isSession) {
    ConversationsCollection.update(
      {
        _id: convo._id,
      },
      {
        $set: {
          isRemove: false,
          sessionId: uuidv4(),
          createdBy: userId,
        },
      },
    );
  } else {
    ConversationsCollection.update(
      {
        _id: convo._id,
      },
      {
        $set: {
          createdBy: userId,
        },
      },
    );
  }
  const users = Meteor.users.find({ _id: { $in: participants } }).fetch();
  convo.addParticipants(users);
  return convo;
}

// 根据当前用户获取所有的会话
export function getConversationsByCurrentUser(user, ids) {
  console.log('ids', ids);
  if (ids) {
    return ConversationsCollection.find({
      _id: { $in: ids },
      sessionId: {
        $exists: false,
      },
      isRemove: false,
    })
      .fetch()
      .map(item => {
        return {
          ...item,
          messages: [
            ConversationsCollection.findOne({ _id: item._id }).lastMessage(),
          ],
          unreadCount: MessagesCollection.find({
            conversationId: item._id,
            readedIds: {
              $nin: [user._id],
            },
          }).count(),
          type: item._participants.length > 2 ? 'GROUP' : 'ONE_TO_ONE',
          participants: ProfilesCollection.find(
            { _id: { $in: item._participants } },
            {
              fields: {
                _id: 1,
                photoURL: 1,
                username: 1,
                displayName: 1,
                realName: 1,
                address: 1,
                phoneNumber: 1,
              },
            },
          ).fetch(),
        };
      });
  }
  return ConversationsCollection.find({
    isRemove: false,
    _participants: {
      $in: [user._id],
    },
    sessionId: {
      $exists: false,
    },
  })
    .fetch()
    .map(item => {
      return {
        ...item,
        messages: [
          ConversationsCollection.findOne({ _id: item._id }).lastMessage(),
        ],
        unreadCount: MessagesCollection.find({
          conversationId: item._id,
          readedIds: {
            $nin: [user._id],
          },
        }).count(),
        type: item._participants.length > 2 ? 'GROUP' : 'ONE_TO_ONE',
        participants: ProfilesCollection.find(
          { _id: { $in: item._participants } },
          {
            fields: {
              _id: 1,
              photoURL: 1,
              username: 1,
              displayName: 1,
              realName: 1,
              address: 1,
              phoneNumber: 1,
            },
          },
        ).fetch(),
      };
    });
}

// 更新会话 id 的阅读状态
export function updateReadState({ conversationId, status }) {
  return ConversationsCollection.findOne({
    _id: conversationId,
  }).updateReadState(status);
}

// 根据会话 id添加一组参与者
export function addParticipants({ conversationId, participants }) {
  const users = Meteor.users.find({ _id: { $in: participants } }).fetch();
  return ConversationsCollection.findOne({
    _id: conversationId,
  }).addParticipants(users);
}

// 根据会话 id添加参与者
export function addParticipant({ conversationId, participant }) {
  const user = Meteor.users.findOne({ _id: participant?._id || participant });
  ConversationsCollection.findOne({
    _id: conversationId,
  }).addParticipant(user);
  return true;
}

// 根据会话 id删除参与者
export function removeParticipant({ conversationId, participant }) {
  const user = Meteor.users.findOne({ _id: participant?._id || participant });
  ConversationsCollection.findOne({
    _id: conversationId,
  }).removeParticipant(user);
  return true;
}

// 根据会话 id删除一组参与者
export function removeParticipants({ conversationId, participants }) {
  const query = {
    conversationId,
    userId: {
      $in: participants,
    },
  };
  const modifier = { $set: { deleted: true, read: true } };
  return ParticipantsCollection.update(query, modifier);
}

// 根据会话 id 获取所有的参与者
export function participants(conversationId) {
  const user = Meteor.users.find({ _id: participant }).fetch();
  return ConversationsCollection.findOne({
    _id: conversationId,
  }).participants();
}

// 根据会话 id 获取所有的参与者的信息
export function participantsAsUsers(conversationId) {
  return ProfilesCollection.find({
    _id: {
      $in: ConversationsCollection.findOne({ _id: conversationId })
        .participantsAsUsers()
        .map(item => item._id),
    },
  }).map(item => {
    return {
      ...item,
      // status: "busy",
    };
  });
}

// 根据参与者 id 获取对应的会话信息
export function conversationByParticipantId(participantId) {
  return ParticipantsCollection.findOne({ _id: participantId }).conversation();
}

// 根据参与者 id 获取对应的用户信息
export function userByParticipantId(participantId) {
  return ParticipantsCollection.findOne({ _id: participantId }).user();
}

// 获取当前用户的未读会话数量
export function numUnreadConversationsByCurrentUser(user) {
  return user.numUnreadConversations();
}

// 获取当前用户的未读会话数量
export function numUnreadConversations(userId) {
  return Meteor.users.findOne({ _id: userId }).numUnreadConversations();
}

// 根据当前用户获取所有的会话(有问题)
export function getConversations(userId) {
  return Meteor.users
    .findOne({ _id: userId })
    .fetch()
    .map(item => {
      return {
        ...item,
        messages: [
          ConversationsCollection.findOne({ _id: item._id }).lastMessage(),
        ],
        unreadCount: 0,
        type: item._participants.length > 2 ? 'GROUP' : 'ONE_TO_ONE',
        participants: ProfilesCollection.find({
          _id: { $in: item._participants },
        }).fetch(),
      };
    });
}

// 判断当前用户是否在指定的会话中
export function isParticipatingInByCurrentUser({ participantId, user }) {
  return user.isParticipatingIn(participantId);
}

// 判断当前用户是否在指定的会话中
export function isParticipatingIn({ participantId, userId }) {
  return Meteor.users.findOne({ _id: userId }).isParticipatingIn(participantId);
}

// 软删除会话
export function softRemoveConversation(conversationId) {
  return ConversationsCollection.update(
    {
      _id: conversationId,
    },
    {
      $set: {
        isRemove: true,
      },
    },
  );
}

// 软删除会话
export function getConversationsByParticipantIds({
  participants,
  userId,
  isSession,
}) {
  return ConversationsCollection.find({
    sessionId: { $exists: isSession },
    isRemove: false,
    _participants: {
      $all: _.uniq([...participants, userId]),
    },
  }).map(item => ({
    ...item,
    participants: ProfilesCollection.find(
      { _id: { $in: _.uniq([...participants, userId]) } },
      {
        fields: {
          _id: 1,
          photoURL: 1,
          username: 1,
          displayName: 1,
          realName: 1,
          address: 1,
          phoneNumber: 1,
        },
      },
    ).fetch(),
  }));
}
