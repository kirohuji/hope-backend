import Api from "../../api";
import _ from 'lodash'
import { FriendsCollection } from 'meteor/socialize:friendships'

Api.addRoute('friendships/friends', {
    post: {
        authRequired: true,
        action: function () {
            return this.user.friends(this.bodyParams.options || { sort: { createdAt: -1 } }).fetch();
        }
    }
});

Api.addRoute('friendships/friendsAsUsers', {
    post: {
        authRequired: true,
        action: function () {
            const friends = this.user.friends(this.bodyParams.options || { sort: { createdAt: -1 } }).fetch();
            const ids = friends.map(friend => friend.friendId);
            return Meteor.users.find({ _id: { $in: ids } }).fetch()
        }
    }
});
/** 删除好友 */
Api.addRoute('friendships/unfriend/:_id', {
    get: {
        authRequired: true,
        action: function () {
            const friend = FriendsCollection.findOne({ userId: this.userId, friendId: this.urlParams._id });
            return friend && friend.remove();
        }
    }
});

Api.addRoute('friendships/isFriendsWith/:_id', {
    get: {
        authRequired: true,
        action: function () {
            return !!FriendsCollection.findOne({ userId: this.userId, friendId: this.urlParams._id });
        }
    }
});

Api.addRoute('friendships/friendRequests', {
    post: {
        authRequired: true,
        action: function () {
            try {
                return Meteor.users.findOne({ _id: this.userId }).friendRequests(this.bodyParams.options || {}).fetch()
            } catch (e) {
                return false
            }
        }
    }

});
Api.addRoute('friendships/numFriendRequests', {
    post: {
        authRequired: true,
        action: function () {
            try {
                return Meteor.users.findOne({ _id: this.userId }).friendRequests().count()
            } catch (e) {
                return false
            }
        }
    }

});
