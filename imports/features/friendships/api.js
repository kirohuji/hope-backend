import Api from "../../api";
import _ from "lodash";
import { Friend, FriendsCollection } from "meteor/socialize:friendships";
import { Request, RequestsCollection } from "meteor/socialize:requestable";
import { ProfilesCollection } from "meteor/socialize:user-profile";
Api.addRoute("friendships/friends", {
  post: {
    authRequired: true,
    action: function () {
      return this.user
        .friends(this.bodyParams.options || { sort: { createdAt: -1 } })
        .fetch();
    },
  },
});

Api.addRoute("friendships/friendsAsUsers", {
  post: {
    authRequired: true,
    action: function () {
      const ids = this.user
        .friendsAsUsers(this.bodyParams.options || { sort: { createdAt: -1 } })
        .map((item) => item._id);
      const ids2 = Meteor.users
        .find({ _id: { $nin: [this.user._id] } })
        .map((item) => item._id);
      return ProfilesCollection.find(
        { _id: { $in: _.uniq([...ids, ...ids2]) } },
        {
          fields: {
            _id: 1,
            username: 1,
            displayName: 1,
            username: 1,
            realName: 1,
          },
        }
      ).fetch();
    },
  },
});
/** 删除好友 */
Api.addRoute("friendships/unfriend/:_id", {
  get: {
    authRequired: true,
    action: function () {
      const friend = FriendsCollection.findOne({
        userId: this.userId,
        friendId: this.urlParams._id,
      });
      friend && friend.remove();
      return true;
    },
  },
});

Api.addRoute("friendships/isFriendsWith/:_id", {
  get: {
    authRequired: true,
    action: function () {
      return !!FriendsCollection.findOne({
        userId: this.userId,
        friendId: this.urlParams._id,
      });
    },
  },
});

Api.addRoute("friendships/friendRequests", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return this.user
          .friendRequests(this.bodyParams.options || {})
          .map((item) => {
            return {
              ...item,
              ...ProfilesCollection.findOne({ _id: item.requesterId }),
            };
          });
      } catch (e) {
        return false;
      }
    },
  },
});
Api.addRoute("friendships/numFriendRequests", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return this.user.friendRequests().count();
      } catch (e) {
        return false;
      }
    },
  },
});

Api.addRoute("friendships/hasFriendshipRequestFrom/:_id", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return this.user.hasFriendshipRequestFrom({ _id: this.urlParams._id });
      } catch (e) {
        return false;
      }
    },
  },
});

/** 向一个用户申请好友 */
Api.addRoute("friendships/requestFriendship/:_id", {
  get: {
    authRequired: true,
    action: function () {
      return RequestsCollection.insert(
        new Request({
          ...Meteor.users.findOne({ _id: this.urlParams._id }).getLinkObject(),
          type: "friend",
        }),
        {
          extendAutoValueContext: {
            userId: this.userId,
          },
        }
      );
    },
  },
});

/** 改造 */
Api.addRoute("friendships/cancelFriendshipRequest/:_id", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return this.user.cancelFriendshipRequest({ _id: this.urlParams._id });
      } catch (e) {
        return false;
      }
    },
  },
});
Api.addRoute("friendships/acceptFriendshipRequest/:_id", {
  get: {
    authRequired: true,
    action: function () {
      const request = RequestsCollection.findOne({
        type: "friend",
        requesterId: this.urlParams._id,
        linkedObjectId: this.userId,
      });
      /** 添加一条记录 */
      const freindId = FriendsCollection.direct.insert(
        new Friend({
          userId: this.userId,
          friendId: request.requesterId,
          createdAt: new Date(),
        })
      );
      /** 互相添加 */
      const user = Meteor.users.findOne({ _id: this.urlParams._id });
      const friend = this.user;

      if (friend.hasFriendshipRequestFrom(user)) {
        RequestsCollection.remove({
          linkedObjectId: this.userId,
          requesterId: request.requesterId,
          type: "friend",
        });
        RequestsCollection.remove({
          linkedObjectId: request.requesterId,
          requesterId: this.userId,
          type: "friend",
        });
        FriendsCollection.direct.insert({
          userId: request.requesterId,
          friendId: this.userId,
          createdAt: new Date(),
        });
      }
      return freindId;
    },
  },
});

Api.addRoute("friendships/denyFriendshipRequest/:_id", {
  get: {
    authRequired: true,
    action: function () {
      try {
        const request = RequestsCollection.findOne({
          type: "friend",
          requesterId: this.urlParams._id,
          linkedObjectId: this.userId,
        });
        request && request.deny();
        return true;
      } catch (e) {
        return false;
      }
    },
  },
});

Api.addRoute("friendships/ignoreFriendshipRequest/:_id", {
  get: {
    authRequired: true,
    action: function () {
      try {
        const request = RequestsCollection.findOne({
          type: "friend",
          requesterId: this.urlParams._id,
          linkedObjectId: this.userId,
        });
        request && request.ignore();
        return true;
      } catch (e) {
        return false;
      }
    },
  },
});
