import {
  Conversation,
  ConversationsCollection,
  ParticipantsCollection,
  Message,
  MessagesCollection,
} from 'meteor/socialize:messaging';
import { ProfilesCollection } from 'meteor/socialize:user-profile';
import _ from 'lodash';
import { PushNotificationTokenCollection } from './collection';
import moment from 'moment';
// const firebaseAdmin = require('firebase-admin');
// const serviceAccount = require('./hopehome-12650-firebase-adminsdk-ornad-b1abbd59c9.json');

// firebaseAdmin.initializeApp({
//   credential: firebaseAdmin.credential.cert(serviceAccount),
// });

const huaweiConfig = {
  appId: '113475539',
  appSecret: 'd3036c59f4ed320bd6e7c1eb6f73ba91b62a3dba5a436a7928140020d18dd20a',
};
const HUAWEI_TOKEN_URL = 'https://oauth-login.cloud.huawei.com/oauth2/v3/token';

async function getHuaweiAccessToken() {
  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', huaweiConfig.appId);
    params.append('client_secret', huaweiConfig.appSecret);

    const response = await fetch(HUAWEI_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`HTTP 错误! 状态码: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('获取华为 Access Token 失败:', error.message);
    throw error;
  }
}

export async function sendHuaweiPush({
  contentType,
  body,
  profile,
  conversationId,
  userToken,
}) {
  try {
    const { appId } = huaweiConfig;
    const accessToken = await getHuaweiAccessToken();

    const payload = {
      validate_only: false,
      message: {
        data: JSON.stringify({
          title: profile.displayName,
          body: contentType === 'text' ? body : '对方发送了一张图片给你',
          sound: 'default',
          launchImage: profile.photoURL,
          topic: 'lourd.hope.app', // iOS app 的 bundle id
          badge: MessagesCollection.find({
            conversationId,
            readedIds: { $nin: [userToken.userId] },
          }).count(),
        }),
        token: [userToken.token],
      },
    };
    console.log('payload', payload);

    const url = `https://push-api.cloud.huawei.com/v1/${appId}/messages:send`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`推送失败: ${errorData.message}`);
    } else {
      const data = await response.json();
      console.log(`推送成功:${JSON.stringify(data)}`);
    }
    return true;
  } catch (error) {
    console.error('推送失败:', error.message);
    throw new Meteor.Error('push-failed', error.message);
  }
}

export function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// 删除会话
export function removeConversations(conversationId) {
  MessagesCollection.remove({ conversationId });
  ParticipantsCollection.remove({ conversationId });
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
  return 0;
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
  let result = MessagesCollection.find(
    {
      conversationId,
      deleteIds: { $nin: [userId] },
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
  const isExsist = PushNotificationTokenCollection.findOne({
    'deviceId.identifier': deviceId?.identifier,
  });
  if (isExsist && isExsist.userId !== userId) {
    return PushNotificationTokenCollection.update(
      {
        'deviceId.identifier': deviceId?.identifier,
      },
      {
        $set: {
          userId,
          token,
          updatedAt: new Date(),
          device,
          deviceId,
        },
      },
    );
  } else if (!isExsist) {
    return PushNotificationTokenCollection.insert({
      userId,
      token,
      updatedAt: new Date(),
      device,
      deviceId,
    });
  } else {
    return false;
  }
}
export function updateDeviceStatus({ userId, status, deviceId }) {
  const isExsist = PushNotificationTokenCollection.findOne({
    userId,
    'deviceId.identifier': deviceId?.identifier,
  });
  if (isExsist) {
    PushNotificationTokenCollection.update(
      {
        userId,
        'deviceId.identifier': deviceId?.identifier,
      },
      {
        $set: {
          status,
        },
      },
    );
  }
  return true;
}

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

// 发送消息
export function sendMessage({ conversationId, userId, bodyParams }) {
  let bodyMessage = bodyParams.body;
  const checkedMessage = Meteor.checkProfanity(bodyMessage);
  const message = MessagesCollection.insert(
    new Message({
      conversationId,
      body: checkedMessage,
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
    Meteor.call('queue.addNotification', {
      body: bodyParams.body,
      contentType: bodyParams.contentType,
      conversationId,
      excludeIds: [userId],
    });
  }
  return message;
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
          $size: _.uniq([...participants, userId]).length,
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
  if (ids) {
    return ConversationsCollection.find({
      _id: { $in: ids },
      sessionId: {
        $exists: false,
      },
      $or: [{ isRemove: false }, { isRemove: { $exists: false } }],
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
    // isRemove: false,
    $or: [{ isRemove: false }, { isRemove: { $exists: false } }],
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
  const conversation = ConversationsCollection.findOne({ _id: conversationId });
  if (!conversation) {
    throw new Error('会话不存在');
  }

  const users = Meteor.users.find({ _id: { $in: participants } }).fetch();
  if (!users || users.length === 0) {
    throw new Error('用户不存在');
  }

  // 检查是否所有参与者都找到了
  if (users.length !== participants.length) {
    throw new Error('部分用户不存在');
  }

  conversation.addParticipants(users);
  return true;
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
export function softRemoveConversation(conversationId, userId) {
  const conversation = ConversationsCollection.findOne({ _id: conversationId });
  if (!conversation) {
    throw new Error('会话不存在');
  }
  if (conversation._participants.length > 2) {
    return removeConversations(conversationId);
  } else {
    MessagesCollection.update(
      {
        conversationId,
      },
      {
        $addToSet: {
          deleteIds: userId,
        },
      },
      { multi: true },
    );

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
}

// 软删除会话
export function getConversationsByParticipantIds({
  participants,
  userId,
  isSession,
}) {
  return ConversationsCollection.find({
    sessionId: { $exists: isSession },
    $or: [{ isRemove: false }, { isRemove: { $exists: false } }],
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

// API service functions with error handling
export const handleConversationDelete = (conversationId) => {
  try {
    return removeConversations(conversationId);
  } catch (error) {
    throw new Error(`Failed to delete conversation: ${error.message}`);
  }
};

export const handleConversationUpdate = ({ conversationId, ...updateData }) => {
  try {
    return updateConversations({
      conversationId,
      ...updateData
    });
  } catch (error) {
    throw new Error(`Failed to update conversation: ${error.message}`);
  }
};

export const handleGetConversationById = ({ userId, conversationId }) => {
  try {
    return getConversationsById({
      userId,
      conversationId
    });
  } catch (error) {
    throw new Error(`Failed to get conversation: ${error.message}`);
  }
};

export const handleUnreadConversations = ({ user, bodyParams }) => {
  try {
    return unreadConversations({
      user,
      bodyParams
    });
  } catch (error) {
    throw new Error(`Failed to get unread conversations: ${error.message}`);
  }
};

export const handleNewestConversation = ({ user }) => {
  try {
    return newestConversation({ user });
  } catch (error) {
    throw new Error(`Failed to get newest conversation: ${error.message}`);
  }
};

export const handleIsObserving = ({ user, _id }) => {
  try {
    return isObserving({ user, _id });
  } catch (error) {
    throw new Error(`Failed to check observing status: ${error.message}`);
  }
};

export const handleFindExistingConversation = ({ userId, users }) => {
  try {
    return findExistingConversationWithUsers({ userId, users });
  } catch (error) {
    throw new Error(`Failed to find existing conversation: ${error.message}`);
  }
};

export const handleIsUnread = ({ conversationId, userId }) => {
  try {
    return isUnread({ conversationId, userId });
  } catch (error) {
    throw new Error(`Failed to check unread status: ${error.message}`);
  }
};

export const handleIsReadOnly = (conversationId) => {
  try {
    return isReadOnly(conversationId);
  } catch (error) {
    throw new Error(`Failed to check read-only status: ${error.message}`);
  }
};

export const handleGetMessages = ({ userId, conversationId, bodyParams }) => {
  try {
    return messages({
      userId,
      conversationId,
      bodyParams
    });
  } catch (error) {
    throw new Error(`Failed to get messages: ${error.message}`);
  }
};

export const handleGetMessagesWithDate = ({ date, conversationId, bodyParams }) => {
  try {
    return messagesWithDate({
      date,
      conversationId,
      bodyParams
    });
  } catch (error) {
    throw new Error(`Failed to get messages with date: ${error.message}`);
  }
};

export const handleGetAttachments = (conversationId) => {
  try {
    return attachments(conversationId);
  } catch (error) {
    throw new Error(`Failed to get attachments: ${error.message}`);
  }
};

export const handleGetLastMessage = (conversationId) => {
  try {
    const message = lastMessage(conversationId);
    if (message) {
      return {
        ...message,
        user: ProfilesCollection.findOne({ _id: message.userId })
      };
    }
    return { user: {} };
  } catch (error) {
    throw new Error(`Failed to get last message: ${error.message}`);
  }
};

export const handleGetLastMessageByLastId = ({ userId, lastId, conversationId }) => {
  try {
    return lastMessageByLastId({
      userId,
      lastId,
      conversationId
    });
  } catch (error) {
    throw new Error(`Failed to get last message by last ID: ${error.message}`);
  }
};

export const handleSendMessage = ({ conversationId, userId, bodyParams }) => {
  try {
    const messageId = sendMessage({
      conversationId,
      userId,
      bodyParams
    });
    if (messageId) {
      const message = MessagesCollection.findOne({ _id: messageId });
      return {
        ...message,
        senderId: message.userId
      };
    }
  } catch (error) {
    throw new Error(`Failed to send message: ${error.message}`);
  }
};

export const handleSavePushToken = ({ userId, token, device, deviceId }) => {
  try {
    return savePushNotificationToken({
      userId,
      token,
      device,
      deviceId
    });
  } catch (error) {
    throw new Error(`Failed to save push token: ${error.message}`);
  }
};

export const handleUpdateDeviceStatus = ({ userId, status, deviceId }) => {
  try {
    return updateDeviceStatus({
      userId,
      status,
      deviceId
    });
  } catch (error) {
    throw new Error(`Failed to update device status: ${error.message}`);
  }
};

export const handleCreateConversation = ({ isSession, sessionId, participants, userId }) => {
  try {
    return createNewConversations({
      isSession,
      sessionId,
      participants,
      userId
    });
  } catch (error) {
    throw new Error(`Failed to create conversation: ${error.message}`);
  }
};

export const handleGetConversationsByParticipantIds = ({ participants, userId, isSession }) => {
  try {
    return getConversationsByParticipantIds({
      participants,
      userId,
      isSession
    });
  } catch (error) {
    throw new Error(`Failed to get conversations by participant IDs: ${error.message}`);
  }
};

export const handleGetConversationsByCurrentUser = (user, ids) => {
  try {
    return getConversationsByCurrentUser(user, ids);
  } catch (error) {
    throw new Error(`Failed to get conversations by current user: ${error.message}`);
  }
};

export const handleUpdateReadState = ({ conversationId, status }) => {
  try {
    return updateReadState({
      conversationId,
      status
    });
  } catch (error) {
    throw new Error(`Failed to update read state: ${error.message}`);
  }
};

export const handleAddParticipants = ({ conversationId, participants }) => {
  try {
    return addParticipants({
      conversationId,
      participants
    });
  } catch (error) {
    throw new Error(`Failed to add participants: ${error.message}`);
  }
};

export const handleRemoveParticipants = ({ conversationId, participants }) => {
  try {
    return removeParticipants({
      conversationId,
      participants
    });
  } catch (error) {
    throw new Error(`Failed to remove participants: ${error.message}`);
  }
};

export const handleAddParticipant = ({ conversationId, participant }) => {
  try {
    return addParticipant({
      conversationId,
      participant
    });
  } catch (error) {
    throw new Error(`Failed to add participant: ${error.message}`);
  }
};

export const handleRemoveParticipant = ({ conversationId, participant }) => {
  try {
    return removeParticipant({
      conversationId,
      participant
    });
  } catch (error) {
    throw new Error(`Failed to remove participant: ${error.message}`);
  }
};

export const handleGetParticipants = (conversationId) => {
  try {
    return participants(conversationId);
  } catch (error) {
    throw new Error(`Failed to get participants: ${error.message}`);
  }
};

export const handleGetParticipantsAsUsers = (conversationId) => {
  try {
    return participantsAsUsers(conversationId);
  } catch (error) {
    throw new Error(`Failed to get participants as users: ${error.message}`);
  }
};

export const handleGetConversationByParticipantId = (participantId) => {
  try {
    return conversationByParticipantId(participantId);
  } catch (error) {
    throw new Error(`Failed to get conversation by participant ID: ${error.message}`);
  }
};

export const handleGetUserByParticipantId = (participantId) => {
  try {
    return userByParticipantId(participantId);
  } catch (error) {
    throw new Error(`Failed to get user by participant ID: ${error.message}`);
  }
};

export const handleGetNumUnreadConversationsByCurrentUser = (user) => {
  try {
    return numUnreadConversationsByCurrentUser(user);
  } catch (error) {
    throw new Error(`Failed to get number of unread conversations: ${error.message}`);
  }
};

export const handleGetNumUnreadConversations = (userId) => {
  try {
    return numUnreadConversations(userId);
  } catch (error) {
    throw new Error(`Failed to get number of unread conversations: ${error.message}`);
  }
};

export const handleGetConversations = (userId) => {
  try {
    return getConversations(userId);
  } catch (error) {
    throw new Error(`Failed to get conversations: ${error.message}`);
  }
};

export const handleIsParticipatingInByCurrentUser = ({ participantId, user }) => {
  try {
    return isParticipatingInByCurrentUser({
      participantId,
      user
    });
  } catch (error) {
    throw new Error(`Failed to check participation status: ${error.message}`);
  }
};

export const handleIsParticipatingIn = ({ participantId, userId }) => {
  try {
    return isParticipatingIn({
      participantId,
      userId
    });
  } catch (error) {
    throw new Error(`Failed to check participation status: ${error.message}`);
  }
};

export const handleSoftRemoveConversation = (conversationId, userId) => {
  try {
    return softRemoveConversation(conversationId, userId);
  } catch (error) {
    throw new Error(`Failed to soft remove conversation: ${error.message}`);
  }
};
