import Api from "../../api";
import Model from './collection'
import _ from 'lodash'
import { Roles } from 'meteor/alanning:roles';
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
Api.addRoute('users/search', {
  post: function () {
    return {
      data: Meteor.users.find(this.bodyParams.selector || {}, this.bodyParams.options).fetch()
    }
  }
});
Api.addRoute('users/info', {
  get: {
    authRequired: true,
    action: function () {
      const roles = Meteor.roles.find({
        _id: {
          $in: Roles.getRolesForUser(this.userId, {
            anyScope: true,
          })
        }
      }, {
        fields: {
          _id: 1,
          name: 1,
          type: 1
        }
      }).fetch()
      const permissions = roles.filter(item => item.type === "permission")
      return {
        user: _.omit(this.user, ["services"]),
        profile: this.user.profile(),
        roles: roles.filter(item => item.type !== 'permission'),
        permissions: permissions.map(item => item._id)
      }
    }
  }
});