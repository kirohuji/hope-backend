import Api from "../../api";
import { ProfilesCollection } from 'meteor/socialize:user-profile';
import Model from './collection'
import _ from 'lodash'
Api.addCollection(ProfilesCollection, {
    path: 'profiles',
    routeOptions: { authRequired: false },
});
Api.addRoute('profiles/model', {
    get: function () {
        console.log()
        return {
            fields: Model.schema.fields,
            fieldsNames: Model.schema.fieldsNames
        }
    }
});
Api.addRoute('profiles/pagination', {
    post: function () {
      return {
        data: Model.find(this.bodyParams.selector || {}, this.bodyParams.options).fetch(),
        total: Model.find().count()
      }
    }
  });
  