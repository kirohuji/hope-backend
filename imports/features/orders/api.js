import Api from "../../api";
import Constructor, { serverError500 } from "../base/api";
import Model, {
  OrderItem,
  OrderItemCollection,
  OrderCollection,
} from "./collection";
import { pagination, info } from "./service";
import _ from "lodash";

Api.addCollection(OrderCollection, {
  path: "orders",
});

Constructor("orders", Model);

Api.addCollection(OrderItemCollection, {
  path: "orders/items",
});

Constructor("orders/items", OrderItem);

Api.addRoute("orders/pagination", {
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

Api.addRoute("orders/:_id", {
  get: function () {
    try {
      return info(this.urlParams.id || this.urlParams._id);
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});
