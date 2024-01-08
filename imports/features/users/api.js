import _ from "lodash";
import Api from "../../api";
import Constructor from "../base/api";
import Model from "./collection";
import {
  pagination,
  paginationByProfile,
  register,
  removeUser,
  removeUsers,
  info,
  infoByCurrent,
  changePassword,
  activation,
} from "./service";
import { serverError500 } from "../base/api";

Api.addCollection(Meteor.users);

Constructor("users", Model);

Api.addRoute("users/pagination", {
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
Api.addRoute("users/profiles/pagination", {
  post: function () {
    try {
      return paginationByProfile(this.bodyParams);
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});
Api.addRoute("users/delete/:_id", {
  delete: function () {
    try {
      return removeUser(this.urlParams._id);
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

Api.addRoute("users/deleteMany", {
  post: {
    authRequired: true,
    action: function () {
      try {
        removeUsers(this.bodyParams._ids);
        return true;
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("users/activation", {
  post: {
    authRequired: true,
    action: function () {
      try {
        activation(this.bodyParams._ids);
        return true;
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("users/register", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return register(this.bodyParams);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("users/info", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return infoByCurrent({
          user: this.user,
          userId: this.userId,
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

Api.addRoute("users/info/:_id", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return info(this.urlParams._id);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("users/changePassword", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return changePassword({
          user: this.user,
          password: this.bodyParams.oldPassword,
          newPassword: this.bodyParams.newPassword,
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
