import { Class } from "meteor/jagi:astronomy";
export const NotificationtCollection = new Mongo.Collection('notifications')
export const NotificationUserCollection = new Mongo.Collection('notifications_users')
export const SocketUserCollection = new Mongo.Collection('socket_users')
import { ProfilesCollection } from 'meteor/socialize:user-profile';
Meteor.notifications = NotificationtCollection;

export const NotificationUser = Class.create({
    name: "NotificationUser",
    collection: NotificationUserCollection,
    fields: {
        user_id: Mongo.ObjectID,
        notification_id: Mongo.ObjectID,
        status: String
    },
});

export const SocketUser = Class.create({
    name: "SocketUser",
    collection: SocketUserCollection,
    fields: {
        user_id: Mongo.ObjectID,
        socket_id: Mongo.ObjectID,
    },
});
export default Class.create({
    name: "Notification",
    collection: NotificationtCollection,
    fields: {
        value: {
            type: String,
            default: '',
        },
        label: {
            type: String,
            default: '',
            label: '名称',
        },
        description: {
            type: String,
            default: '',
        },
        type: {
            type: String,
            default: 'article',
        },
        isUnRead: {
            type: Boolean,
            default: true
        },
        isRemove: {
            type: Boolean,
            default: false
        },
        avatarUrl: {
            type: String,
            default: null
        },
        category: {
            type: String,
            default: 'Training',
        },
        createdAt: {
            type: String,
            default: '2023/10/23',
        },
        publisher_id: {
            type: String,
            default: '',
        },
        target_id: {
            type: String,
            default: '',
        },

        title: {
            type: String,
            default: '<p>打卡成功</p>'
        }
    }
});

