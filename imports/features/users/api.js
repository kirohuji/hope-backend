import Api from "../../api";
import Model from './collection'
import _ from 'lodash'
Api.addCollection(Meteor.users, {
  routeOptions: { authRequired: false },
});
Api.addRoute('users/model', {
  get: function () {
    return {
      fields: Model.schema.fields,
      fieldsNames: Model.schema.fieldsNames
    }
  }
});
Api.addRoute('users/pagination', {
  post: function () {
    return {
      data: Model.find(this.bodyParams.selector || {}, this.bodyParams.options).fetch().map(item => {
        return {
          ..._.omit(item, 'profile'),
        }
      }),
      total: Model.find().count()
    }
  }
});