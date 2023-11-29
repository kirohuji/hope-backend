import Api from "../../api";
import Model from './collection'
import ProfileModel from '../profiles/collection'
import { ProfilesCollection } from 'meteor/socialize:user-profile';
import _ from 'lodash'
import { Roles } from 'meteor/alanning:roles';
import { roleRequired } from "../../utils";
import { Accounts } from "meteor/accounts-base";
Api.addCollection(Meteor.users);
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
    if (this.bodyParams.selector && this.bodyParams.selector.available == "all") {
      this.bodyParams.selector = _.pickBy(_.omit(this.bodyParams.selector, ["available"]))
    }
    if (this.bodyParams.selector && this.bodyParams.selector.username) {
      this.bodyParams.selector.username = {
        $regex: this.bodyParams.selector.username,
        $options: "i"
      }
    }
    return {
      data: ProfileModel.find(this.bodyParams.selector || {}, this.bodyParams.options).fetch().map(item => {
        const user = Meteor.users.findOne({ _id: item._id })
        const roles = _.compact(Meteor.roles.find({
          _id: {
            $in: Roles.getRolesForUser(item._id, {
              scope: this.bodyParams?.options.scope,
            })
          }
        }).fetch().filter(item => item.type == 'role'))
        return {
          ...user,
          ...item,
          roles: roles
        }
      }),
      total: ProfileModel.find(this.bodyParams.selector || {}, this.bodyParams.options).count()
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
Api.addRoute('users/delete/:_id', {
  delete: function () {
    ProfilesCollection.remove({ _id: this.urlParams._id });
    return Meteor.users.direct.remove({
      _id: this.urlParams._id
    })
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
Api.addRoute('users/register', {
  post: {
    authRequired: true,
    action: function () {
      id = Accounts.createUser({
        ...this.bodyParams,
        password: "123456",
      });
      return id
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
          scope: 1,
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
      const user = Meteor.users.findOne({ _id: this.urlParams._id })
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

Api.addRoute('users/changePassword', {
  post: {
    authRequired: true,
    action: function () {
      // Meteor.loginWithPassword({
      //   id: this.userId
      // },this.bodyParams.oldPassword,(e)=>{
      //   if(!e){
      Accounts.setPassword(this.userId, this.bodyParams.newPassword);
      return true;
      //   return true;
      // }else{
      //   return false;
      // }
      // })
    }
  }
})

// import { userConnected, sessionConnected, userDisconnected, sessionDisconnected } from './user-presence.js';

// Meteor.publish(null, function userPresenceSessionConnected() {
//   console.log("this.userId",this.userId)
//   console.log("this.connection",this.connection)
//   console.log("this.connection.id",this.connection.id)
//     // if (this.userId && this.connection && this.connection.id) {
//     //     userConnected(this.connection.id, this.userId, ServerPresence.serverId(), this.connection);
//     //     sessionConnected(this.connection, this.userId);

//     //     this.onStop(() => {
//     //         userDisconnected(this.connection.id, this.userId, this.connection);
//     //         sessionDisconnected(this.connection, this.userId);
//     //     });
//     // }
//     this.ready();
// }, { is_auto: true });
