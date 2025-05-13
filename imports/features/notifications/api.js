import Api from '../../api';
import Model, {
  NotificationCollection,
  NotificationUserCollection,
} from './collection';
import {
  ConversationsCollection,
  MessagesCollection,
} from 'meteor/socialize:messaging';
import { ProfilesCollection } from 'meteor/socialize:user-profile';
import Constructor from '../base/api';
import _ from 'lodash';
import { serverError500 } from '../base/api';
import { 
  handlePagination,
  handleCurrentPagination,
  handleCheckRead,
  handleGetOverview,
} from './service';
import { publishComposite } from 'meteor/reywood:publish-composite';
import { PushNotificationTokenCollection } from '../messaging/collection';
import Bull from 'bull';
import apn from 'apn';
const CryptoJS = require("crypto-js");
const secretKey = "future";

const isDev = process.env.NODE_ENV !== 'production'; // 判断是否是开发环境

const apnProvider = new apn.Provider({
  token: {
    key: isDev
      ? '/Users/lourd/Desktop/hope/hope-backend/AuthKey_F2J9GLB6LA.p8'
      : '/hope/AuthKey_F2J9GLB6LA.p8', // APNs 密钥的路径
    keyId: 'F2J9GLB6LA', // Key ID
    teamId: '7JB945M6KZ', // Apple Developer Team ID
  },
  production: true, // 设置为 true 在生产环境中使用
});

const queue = new Bull('notification', {
  redis: { host: '115.159.95.166', port: 6379, password: 'Zyd1362848650' },
});

function createNotification({
  contentType,
  body,
  profile,
  conversationId,
  userToken,
}) {
  const notification = new apn.Notification();
  const decryptedMessage = CryptoJS.AES.decrypt(
    body,
    secretKey
  ).toString(CryptoJS.enc.Utf8);
  notification.alert = contentType === 'text' ? decryptedMessage : '对方发送了一张图片给你';
  notification.title = profile.displayName;
  notification.sound = 'default';
  notification.badge = MessagesCollection.find({
    conversationId,
    readedIds: { $nin: [userToken.userId] },
  }).count();
  notification.topic = 'lourd.hope.app'; // iOS app 的 bundle id
  return {
    message: notification,
    profile,
    token: userToken.token,
  };
}

function sendPushNotification({ contentType, body, conversationId, excludeIds }) {
  let userIds = ConversationsCollection.findOne({ _id: conversationId })
    .participantsAsUsers()
    .map(item => item._id);
  const userTokens = PushNotificationTokenCollection.find({
    userId: {
      $in: userIds,
      $nin: excludeIds,
    },
    status: 'deactive',
  }).fetch();
  if (userTokens && userTokens.length > 0) {
    userTokens.forEach(userToken => {
      if (
        Meteor.users.findOne({
          _id: userToken.userId,
        })
      ) {
        const profile = ProfilesCollection.findOne({ _id: userToken.userId });
        if (userToken.device.platform === 'ios') {
          const notification = createNotification({
            contentType,
            body,
            profile,
            conversationId,
            userToken,
          });
          apnProvider
            .send(notification.message, notification.token)
            .then(result => {
              console.log('APNs result:', result);
            })
            .catch(error => {
              console.error('Error sending APNs notification:', error);
            });
        }
        // } else {
        //   sendHuaweiPush({
        //     contentType,
        //     body,
        //     profile,
        //     conversationId,
        //     userToken,
        //   });
        // }
      }
    });
  }
}

queue.process(async job => {
  sendPushNotification({ ...job.data });
});

// Meteor.methods({
//   'queue.addNotification'(data) {
//     queue.add(data);
//   },
// });

Api.addCollection(NotificationCollection);

Constructor('notifications', Model);

Api.addRoute('notifications/pagination', {
  post: function () {
    try {
      return handlePagination(this.bodyParams);
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

Api.addRoute('notifications/current/pagination', {
  post: {
    authRequired: true,
    action: function () {
      try {
        return handleCurrentPagination({
          userId: this.userId,
          selector: this.bodyParams.selector,
          options: this.bodyParams.options
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

Api.addRoute('notifications/current/checkRead/:_id', {
  post: {
    authRequired: true,
    action: function () {
      try {
        return handleCheckRead({
          notificationId: this.urlParams._id,
          userId: this.userId
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

Api.addRoute('notifications/current/overview', {
  get: {
    authRequired: true,
    action: function () {
      try {
        return handleGetOverview(this.userId);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

// 发布
Meteor.publish('notifications', function () {
  return NotificationCollection.find({
    target_id: this.userId,
    isRemove: false,
    isUnRead: true,
  });
});

publishComposite('userUnreadNotifications', {
  find() {
    return NotificationUserCollection.find({
      userId: this.userId,
      isUnRead: true,
      isRemove: false,
    });
  },
  children: [
    {
      find(notificationUser) {
        return NotificationCollection.find({
          _id: notificationUser.notificationId,
        });
      },
    },
  ],
});
