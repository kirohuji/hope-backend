import Model, { AuditCollection } from "./collection";
import Api from "../../api";
import { serverError500 } from "../base/api";
import Constructor from "../base/api";
import { current, createEvent, pagination } from "./service";
import _ from "lodash";

Api.addCollection(AuditCollection);

Constructor("audits", Model);

Api.addRoute("audits/pagination", {
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
