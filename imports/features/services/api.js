import Model, {
  ServiceUser,
  ServiceCollection,
  ServiceUserCollection,
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
} from "./service";
import _ from "lodash";

Api.addCollection(ServiceCollection);

Constructor("services", Model);

Api.addRoute("services/pagination", {
  post: function () {
    try {
      console.log("this.bodyParams", this.bodyParams);
      return pagination(this.bodyParams);
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});
