import moment from "moment";
import Api from "../../api";
import Model, { NotificationtCollection, NotificationUserCollection } from './collection'
import _ from 'lodash'
Api.addCollection(NotificationtCollection);

Api.addRoute('notifications/current', {
    get: {
        authRequired: true,
        action: function () {
            const notifications =  NotificationtCollection.find({
                target_id: this.user_id
            })
            return notifications;
        }
    },
    post: {
        authRequired: true,
        action: function () {
            const eventId = NotificationtCollection.insert(this.bodyParams);
            return NotificationUserCollection.insert({
                user_id: this.userId,
                notification_id: eventId
            });

        }
    }
});

Api.addRoute('notifications/current/:_id', {
    delete: {
        authRequired: true,
        action: function () {
            return NotificationtCollection.remove({
                _id: this.urlParams._id
            });

        }
    },
    post: {
        authRequired: true,
        action: function () {
            return NotificationtCollection.update({
                _id: this.urlParams._id
            }, this.bodyParams);

        }
    }
});

// 发布
Meteor.publish('notifications', function () {
    return NotificationtCollection.find({
        target_id: this.userId,
        isRemove: false,
    })
});

