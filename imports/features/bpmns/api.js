import Model, { BpmnCollection } from "./collection";
import Api from "../../api";
import { serverError500 } from "../base/api";
import Constructor from "../base/api";
import { current, createEvent, pagination } from "./service";
import _ from "lodash";

Api.addCollection(BpmnCollection);

Constructor("bpmns", Model);

Api.addRoute("bpmns/pagination", {
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
