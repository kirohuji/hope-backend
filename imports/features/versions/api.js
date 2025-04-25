import Model, { VersionCollection } from "./collection";
import Api from "../../api";
import Constructor from "../base/api";
import { serverError500 } from "../base/api";
import { pagination, active, getActive } from "./service";
import _ from "lodash";
Api.addCollection(VersionCollection);
Constructor("versions", Model);
Api.addRoute("versions/pagination", {
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

Api.addRoute("versions/current", {
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


Api.addRoute("versions/active", {
  post: function () {
    try {
      return active(this.bodyParams._id);
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
  get: function () {
    try {
      return getActive() || {};
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});