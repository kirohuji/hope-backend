import Model, { ScopeCollection } from "./collection";
import Api from "../../api";
import Constructor from "../base/api";
import { serverError500 } from "../base/api";
import { pagination } from "./service";
import _ from "lodash";

Api.addCollection(ScopeCollection);
Constructor("scopes", Model);

Api.addRoute("scopes/current", {
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
