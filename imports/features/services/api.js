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

Api.addRoute("services/options", {
  post: function () {
    try {
      const route = _.find(Api._routes, ["path", "bpmns/pagination"]);
      console.log(route.endpoints.post.action.call(this));
      return Api._config.paths.map((item) => {
        return {
          label: item,
          value: item,
        };
      });
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

Api.addRoute("services/custom", {
  post: function () {
    try {
      const route = _.find(Api._routes, ["path", this.bodyParams.target]);
      return route.endpoints.post.action.call(this);
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});
