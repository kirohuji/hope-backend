import { Roles } from 'meteor/alanning:roles';
import ProfileModel from '../profiles/collection';
import { ProfilesCollection } from 'meteor/socialize:user-profile';
import { Accounts } from "meteor/accounts-base";
import _ from 'lodash'

// 分页查询数据
export function pagination (bodyParams) {
  if (bodyParams.selector && bodyParams.selector.available == "all") {
    bodyParams.selector = _.pickBy(_.omit(bodyParams.selector, ["available"]))
  }
  if (bodyParams.selector && bodyParams.selector.username) {
    bodyParams.selector.username = {
      $regex: bodyParams.selector.username,
      $options: "i"
    }
  }
  return {
    data: ProfileModel.find(bodyParams.selector || {}, bodyParams.options).fetch().map(item => {
      const user = Meteor.users.findOne({ _id: item._id })
      const roles = _.compact(Meteor.roles.find({
        _id: {
          $in: Roles.getRolesForUser(item._id, {
            scope: bodyParams?.options.scope,
          })
        }
      }).fetch().filter(item => item.type == 'role'))
      return {
        ...user,
        ...item,
        roles: roles
      }
    }),
    total: ProfileModel.find(bodyParams.selector || {}, bodyParams.options).count()
  }
}

// 删除用户
export function removeUser (_id) {
  let isRemove = ProfilesCollection.remove({ _id });
  if (isRemove) {
    return Meteor.users.direct.remove({ _id })
  } else {
    throw new Error('用户删除失败')
  }
}

// 注册用户
export function register (bodyParams) {
  id = Accounts.createUser({
    ...bodyParams,
    password: bodyParams.password || "123456",
  });
  return id
}

// 获取当前用户信息
export function infoByCurrent ({
  userId,
  user
}) {
  const roles = Meteor.roles.find({
    _id: {
      $in: Roles.getRolesForUser(userId, {
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
  }).fetch();
  const permissions = roles.filter(item => item.type === "permission")
  return {
    user: _.omit(user, ["services"]),
    profile: user.profile(),
    roles: roles.filter(item => item.type !== 'permission'),
    permissions: permissions.map(item => item),
  }
}

// 获取用户信息
export function info (_id) {
  const user = Meteor.users.findOne({ _id: _id })
  if(!user){
    throw new Error('用户不存在')
  }
  const roles = Meteor.roles.find({
    _id: {
      $in: Roles.getRolesForUser(user._id, {
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
  }
}

// 修改密码
export function changePassword({
  userId,
  newPassword
}) {
  Accounts.setPassword(userId,newPassword);
  return true;
}