import Model, {
  BroadcastUser,
  BroadcastCollection,
  BroadcastUserCollection,
} from "./collection";
import Api from "../../api";
import Constructor, { serverError500 } from "../base/api";
import {
  pagination,
  count,
  users,
  signIn,
  signOut,
  removeUser,
  publish,
  unPublish,
  addUsers,
  recent,
  getBroadcastByDate,
} from "./service";
import _ from "lodash";
import moment from "moment";

Api.addCollection(BroadcastCollection);

Api.addCollection(BroadcastUserCollection, {
  path: "broadcasts/users",
});

Constructor("broadcasts/users", BroadcastUser);

Constructor("broadcasts", Model);

// 获取今日广播
Api.addRoute("broadcasts/book", {
  get: function () {
    try {
      return getBroadcastByDate();
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

// 分页查询数据
Api.addRoute("broadcasts/pagination", {
  post: function () {
    try {
      return pagination(this.bodyParams);
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

// 获取广播用户列表
Api.addRoute("broadcasts/:_id/users", {
  get: function () {
    try {
      return users(this.urlParams._id);
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

// 获取广播用户数量
Api.addRoute("broadcasts/:_id/users/count", {
  get: function () {
    try {
      return count(this.urlParams._id);
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

// 用户签到
Api.addRoute("broadcasts/:_id/users/:_userId/signIn", {
  post: function () {
    try {
      return signIn({
        broadcast_id: this.urlParams._id,
        user_id: this.urlParams._userId,
      });
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

// 用户退出
Api.addRoute("broadcasts/:_id/users/:_userId/signOut", {
  post: function () {
    try {
      return signOut({
        broadcast_id: this.urlParams._id,
        user_id: this.urlParams._userId,
      });
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

// 删除用户
Api.addRoute("broadcasts/:_id/users/:_userId", {
  delete: function () {
    try {
      return removeUser({
        broadcast_id: this.urlParams._id,
        user_id: this.urlParams._userId,
      });
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

// 发布广播
Api.addRoute("broadcasts/:_id/publish", {
  post: function () {
    try {
      return publish(this.urlParams._id);
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

// 取消发布广播
Api.addRoute("broadcasts/:_id/unpublish", {
  post: function () {
    try {
      return unPublish(this.urlParams._id);
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

// 添加用户
Api.addRoute("broadcasts/addUsers", {
  post: function () {
    try {
      return addUsers({
        broadcast_id: this.bodyParams.broadcast_id,
        users_id: this.bodyParams.users_id,
        currentUserId: this.userId,
      });
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

// 获取最近广播
Api.addRoute("broadcasts/recent", {
  post: function () {
    try {
      return recent(this.bodyParams);
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});
