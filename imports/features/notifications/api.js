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
