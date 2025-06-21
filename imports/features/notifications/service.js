import { NotificationCollection, NotificationUserCollection } from "./collection";
import { ProfilesCollection } from "meteor/socialize:user-profile";
import _ from "lodash";
import { ConversationsCollection, MessagesCollection } from 'meteor/socialize:messaging';
import { PushNotificationTokenCollection } from '../messaging/collection';
import apn from 'apn';
import Bull from 'bull';
const CryptoJS = require("crypto-js");
const SECRET_KEY = "future";

const isDev = process.env.NODE_ENV !== 'production';

const apnProvider = new apn.Provider({
  token: {
    key: isDev
      ? '/Users/lourd/Desktop/hope/hope-backend/AuthKey_F2J9GLB6LA.p8'
      : '/hope/AuthKey_F2J9GLB6LA.p8',
    keyId: 'F2J9GLB6LA',
    teamId: '7JB945M6KZ',
  },
  production: true,
});

const queue = new Bull('notification', {
  redis: { host: '115.159.95.166', port: 6379, password: 'Zyd1362848650' },
});

// Service functions with error handling
export const handlePagination = (bodyParams) => {
  try {
    if (bodyParams.selector && bodyParams.selector.type == "all") {
      bodyParams.selector = _.pickBy(_.omit(bodyParams.selector, ["type"]));
    }
    if (bodyParams.selector && bodyParams.selector.category.length === 0) {
      bodyParams.selector = _.pickBy(_.omit(bodyParams.selector, ["category"]));
    } else if (bodyParams.selector && bodyParams.selector.category.length > 0) {
      bodyParams.selector = {
        ..._.pickBy(bodyParams.selector),
        category: {
          $in: bodyParams.selector.category,
        },
      };
    }
    let curror = NotificationCollection.find(
      _.pickBy(bodyParams.selector) || {},
      bodyParams.options
    );
    const data = curror.fetch();
    const createdByIds = _.map(data, "createdBy");
    const users = ProfilesCollection.find({ _id: { $in: createdByIds } }).fetch();
    const userMap = _.keyBy(users, "_id");
    const enhancedData = data.map((item) => {
      const user = userMap[item.createdBy];
      return {
        ...item,
        createdUser: user,
      };
    });
    return {
      data: enhancedData,
      total: curror.count(),
    };
  } catch (error) {
    throw new Error(`Failed to paginate notifications: ${error.message}`);
  }
};

export const handleCurrentPagination = ({ userId, selector, options }) => {
  try {
    const notificationUsers = NotificationUserCollection.find(
      {
        userId,
        isRemove: false,
        ...selector,
      },
      {
        ...options,
        fields: { notificationId: 1, isUnRead: 1, isRemove: 1 },
      },
    ).fetch();

    const notificationIds = notificationUsers.map(
      item => item.notificationId,
    );

    const notifications = NotificationCollection.find(
      {
        _id: { $in: notificationIds },
      },
      {
        ...options,
      },
    ).map(notification => {
      const notificationUser = notificationUsers.find(
        item => item.notificationId === notification._id,
      );
      return {
        ...notification,
        isUnRead: notificationUser.isUnRead,
      };
    });
    return notifications;
  } catch (error) {
    throw new Error(`Failed to get current notifications: ${error.message}`);
  }
};

export const handleCheckRead = ({ notificationId, userId }) => {
  try {
    return NotificationUserCollection.update(
      {
        notificationId,
        userId,
      },
      {
        $set: {
          isUnRead: false,
        },
      },
    );
  } catch (error) {
    throw new Error(`Failed to check read status: ${error.message}`);
  }
};

export const handleGetOverview = (userId) => {
  try {
    return NotificationUserCollection.rawCollection()
      .aggregate([
        {
          $match: { userId, isRemove: false },
        },
        {
          $group: {
            _id: '$isUnRead',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            value: {
              $cond: { if: '$_id', then: 'unread', else: 'archived' },
            },
            count: 1,
          },
        },
      ])
      .toArray();
  } catch (error) {
    throw new Error(`Failed to get notification overview: ${error.message}`);
  }
};

// Push notification related functions
const createNotification = ({
  contentType,
  body,
  profile,
  conversationId,
  userToken,
}) => {
  try {
    const notification = new apn.Notification();
    const decryptedMessage = CryptoJS.AES.decrypt(
      body,
      SECRET_KEY
    ).toString(CryptoJS.enc.Utf8);
    notification.alert = contentType === 'text' ? decryptedMessage : '对方发送了一张图片给你';
    notification.title = profile.displayName;
    notification.sound = 'default';
    notification.badge = MessagesCollection.find({
      conversationId,
      readedIds: { $nin: [userToken.userId] },
    }).count();
    notification.topic = 'lourd.jiamai.app';
    return {
      message: notification,
      profile,
      token: userToken.token,
    };
  } catch (error) {
    throw new Error(`Failed to create notification: ${error.message}`);
  }
};

export const handleSendPushNotification = ({ contentType, body, conversationId, excludeIds, sendUserId }) => {
  try {
    const sendUserProfile = ProfilesCollection.findOne({ _id: sendUserId });
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
        if (Meteor.users.findOne({ _id: userToken.userId })) {
          // const profile = ProfilesCollection.findOne({ _id: userToken.userId });
          if (userToken.device.platform === 'ios') {
            const notification = createNotification({
              contentType,
              body,
              profile: sendUserProfile,
              conversationId,
              userToken,
            });
            apnProvider
              .send(notification.message, notification.token)
              .then(result => {
                console.log('APNs result:', JSON.stringify(result));
              })
              .catch(error => {
                console.error('Error sending APNs notification:', error);
              });
          }
        }
      });
    }
  } catch (error) {
    throw new Error(`Failed to send push notification: ${error.message}`);
  }
};

// Queue processing
queue.process(async job => {
  try {
    await handleSendPushNotification({ ...job.data });
  } catch (error) {
    console.error('Queue processing error:', error);
  }
});

Meteor.methods({
  'queue.addNotification'(data) {
    try {
      queue.add(data);
    } catch (error) {
      throw new Error(`Failed to add notification to queue: ${error.message}`);
    }
  },
});
