import Api from "../../api";
import Model from './collection'
import _ from 'lodash'
import { Roles } from 'meteor/alanning:roles';
import { roleRequired } from "../../utils";
Api.addCollection(Meteor.users,
  // roleRequired('users', '用户(Users)')
);
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
        const user = Meteor.users.findOne({ _id: item._id })
        const profile = user.profile()
        const roles = _.compact(Meteor.roles.find({
          _id: {
            $in: Roles.getRolesForUser(item._id, {
              scope: this.bodyParams?.options.scope,
            })
          }
        }).fetch().filter(item => item.type == 'role'))
        return {
          ...item,
          ...profile,
          roles: roles
        }
      }),
      total: Model.find(this.bodyParams.selector || {}, this.bodyParams.options).count()
    }
  }
});
Api.addRoute('users/findOne', {
  post: function () {
    return {
      data: Meteor.users.findOne(this.bodyParams.selector || {}, this.bodyParams.options)
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
Api.addRoute('users/search', {
  post: function () {
    return {
      data: Meteor.users.find(this.bodyParams.selector || {}, this.bodyParams.options).fetch()
    }
  }
});
Api.addRoute('users/create/', {
  get: {
    authRequired: true,
    action: function () {
      Meteor.users.insert({
        
      })
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
          label: 1,
          type: 1,
          value: 1
        }
      }).fetch()
      const permissions = roles.filter(item => item.type === "permission")
      return {
        user: _.omit(this.user, ["services"]),
        profile: this.user.profile(),
        roles: roles.filter(item => item.type !== 'permission'),
        permissions: permissions.map(item => item),
        test: true,
      }
    }
  }
});
Api.addRoute('users/info/:_id', {
  get: {
    authRequired: true,
    action: function () {
      const user = Meteor.users.findOne({ _id: this.urlParams._id})
      const roles = Meteor.roles.find({
        _id: {
          $in: Roles.getRolesForUser(this.urlParams._id, {
            anyScope: true,
          })
        }
      }, {
        fields: {
          _id: 1,
          label: 1,
          type: 1,
          value: 1
        }
      }).fetch()
      const permissions = roles.filter(item => item.type === "permission")
      return {
        user: _.omit(user, ["services"]),
        profile: user.profile(),
        roles: roles.filter(item => item.type !== 'permission'),
        permissions: permissions.map(item => item),
        test: true,
      }
    }
  }
});
Api.addRoute('users/test', {
  get: {
    authRequired: false,
    action: function () {
      const cond1 = {
        selector: {
          username: 'admin'
        }
      }
      const cond2 = {
        selector: {
          username: {
            $in: ['demo']
          }
        }
      }
      // const cond3 = compose(cond1,cond2);
      const cond3 = {
        selector: {
          username: {
            $in: ['admin', 'demo']
          }
        }
      }
      return Meteor.users.createQuery({
        $filters: {
          $or: [
            {
              username: 'admin'
            },
            {
              username: {
                $in: ['demo'],
              }
            }]
          ,
          $and: [
            {
              _id: "i23BfGaxPezc94mQW"
            }
          ]
        },
        username: 1
      }).fetch();
    }
  }
});