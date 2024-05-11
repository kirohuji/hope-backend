import Api from "../../api";
import { ProfilesCollection } from 'meteor/socialize:user-profile';
import Model from './collection'
import _ from 'lodash'
import Constructor from "../base/api";
import { serverError500 } from "../base/api";
import { pagination } from "./service";

Api.addCollection(ProfilesCollection, {
  path: 'profiles',
  routeOptions: { authRequired: false },
});

Constructor("profiles", ProfilesCollection);


Api.addRoute('profiles/pagination', {
  post: function () {
    try {
      return pagination(this.bodyParams);
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  }
});
