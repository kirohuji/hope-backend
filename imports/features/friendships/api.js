import Api from "../../api";
import { serverError500 } from "../base/api";
import {
  getFriends,
  getFriendsAsUsers,
  unfriend,
  isFriendsWith,
  getFriendRequests,
  getNumFriendRequests,
  hasFriendshipRequestFrom,
  requestFriendship,
  cancelFriendshipRequest,
  acceptFriendshipRequest,
  denyFriendshipRequest,
  ignoreFriendshipRequest,
} from "./service";

// 获取好友列表
Api.addRoute("friendships/friends", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return getFriends({
          user: this.user,
          options: this.bodyParams.options,
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

// 获取好友用户列表
Api.addRoute("friendships/friendsAsUsers", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return getFriendsAsUsers({
          user: this.user,
          options: this.bodyParams.options,
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

// 删除好友
Api.addRoute("friendships/unfriend/:_id", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return unfriend({
          userId: this.userId,
          friendId: this.urlParams._id,
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

// 检查是否是好友
Api.addRoute("friendships/isFriendsWith/:_id", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return isFriendsWith({
          userId: this.userId,
          friendId: this.urlParams._id,
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

// 获取好友请求列表
Api.addRoute("friendships/friendRequests", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return getFriendRequests({
          user: this.user,
          options: this.bodyParams.options,
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

// 获取好友请求数量
Api.addRoute("friendships/numFriendRequests", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return getNumFriendRequests({
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

// 检查是否有来自指定用户的好友请求
Api.addRoute("friendships/hasFriendshipRequestFrom/:_id", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return hasFriendshipRequestFrom({
          user: this.user,
          friendId: this.urlParams._id,
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

// 发送好友请求
Api.addRoute("friendships/requestFriendship/:_id", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return requestFriendship({
          userId: this.userId,
          friendId: this.urlParams._id,
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

// 取消好友请求
Api.addRoute("friendships/cancelFriendshipRequest/:_id", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return cancelFriendshipRequest({
          user: this.user,
          friendId: this.urlParams._id,
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

// 接受好友请求
Api.addRoute("friendships/acceptFriendshipRequest/:_id", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return acceptFriendshipRequest({
          userId: this.userId,
          friendId: this.urlParams._id,
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

// 拒绝好友请求
Api.addRoute("friendships/denyFriendshipRequest/:_id", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return denyFriendshipRequest({
          userId: this.userId,
          friendId: this.urlParams._id,
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

// 忽略好友请求
Api.addRoute("friendships/ignoreFriendshipRequest/:_id", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return ignoreFriendshipRequest({
          userId: this.userId,
          friendId: this.urlParams._id,
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
