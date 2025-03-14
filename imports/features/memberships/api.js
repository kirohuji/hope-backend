import Model, {
  MembershipType,
  MembershipTypeCollection,
  MembershipCollection,
} from "./collection";
import Api from "../../api";
import { serverError500 } from "../base/api";
import Constructor from "../base/api";
import { pagination } from "./service";
import _ from "lodash";

Api.addCollection(MembershipCollection);

Constructor("memberships", Model);

Api.addCollection(MembershipTypeCollection);

Constructor("memberships/types", MembershipType);

Api.addRoute("memberships/pagination", {
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
