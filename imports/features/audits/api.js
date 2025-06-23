import Model, { AuditCollection } from "./collection";
import Api from "../../api";
import { serverError500 } from "../base/api";
import Constructor from "../base/api";
import { pagination, moderation } from "./service";

Api.addCollection(AuditCollection);

Constructor("audits", Model);

// 分页查询数据
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

// 审核操作
Api.addRoute("audits/:_id/moderation", {
  post: function () {
    try {
      return moderation({
        _id: this.urlParams._id,
        // createdBy: this.createdBy,
        ...this.bodyParams,
      });
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});
