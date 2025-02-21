import Model, { SensitiveWordsCollection } from "./collection";
import Api from "../../api";
import { serverError500 } from "../base/api";
import Constructor from "../base/api";
import { pagination } from "./service";
import _ from "lodash";

Api.addCollection(SensitiveWordsCollection, {
  path: "sensitve/words",
});
Constructor("sensitve/words", Model);

Api.addRoute("sensitve/words/pagination", {
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
