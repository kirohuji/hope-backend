import Api from "../../api";
import Model, { TaskCollection } from "./collection";
import _ from "lodash";
import Constructor from "../base/api";
import { serverError500 } from "../base/api";
import { pagination } from "./service";


Constructor("tasks", Model);

Api.addCollection(TaskCollection, {
  path: "tasks",
  routeOptions: { authRequired: false },
});

Api.addRoute("tasks/model", {
  get: function () {
    return {
      fields: Model.schema.fields,
      fieldsNames: Model.schema.fieldsNames,
    };
  },
});
Api.addRoute("tasks/pagination", {
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
