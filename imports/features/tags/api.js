import Api from "../../api";
import Model, { TagCollection } from "./collection";
import _ from "lodash";
import Constructor from "../base/api";
import { serverError500 } from "../base/api";
import { pagination } from "./service";

Constructor("tags", Model);

Api.addCollection(TagCollection, {
  path: "tags",
  routeOptions: { authRequired: false },
});

Api.addRoute("tags/model", {
  get: function () {
    return {
      fields: Model.schema.fields,
      fieldsNames: Model.schema.fieldsNames,
    };
  },
});
Api.addRoute("tags/pagination", {
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
