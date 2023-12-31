import { Roles } from "meteor/alanning:roles";
import ProfileModel from "../profiles/collection";
import { ProfilesCollection } from "meteor/socialize:user-profile";
import { Accounts } from "meteor/accounts-base";
import { ArticleUserCollection } from "../articles/collection";
import { BookUserCollection } from "../books/collection";
import { BroadcastUserCollection } from "../broadcasts/collection";
import { EventUserCollection } from "../events/collection";
import { NotificationUserCollection } from "../notifications/collection";
import _ from "lodash";

// 分页查询数据
export function pagination(bodyParams) {
  if (bodyParams.selector && bodyParams.selector.available == "all") {
    bodyParams.selector = _.pickBy(_.omit(bodyParams.selector, ["available"]));
  }
  if (bodyParams.selector && bodyParams.selector.username) {
    bodyParams.selector.username = {
      $regex: bodyParams.selector.username,
      $options: "i",
    };
  }
  let data = ProfilesCollection.find(
    bodyParams.selector || {},
    bodyParams.options
  );
  return {
    data: data.fetch(),
    total: ProfilesCollection.find(bodyParams.selector).count(),
  };
}

// 删除用户
export function removeUser(_id) {
  let isRemove = ProfilesCollection.remove({ _id });
  if (isRemove) {
    Meteor.roleAssignment.remove({
      "user._id": _id,
    });
    ArticleUserCollection.remove({ user_id: _id });
    BookUserCollection.remove({ user_id: _id });
    BroadcastUserCollection.remove({ user_id: _id });
    EventUserCollection.remove({ user_id: _id });
    // NotificationUserCollection.remove({ user_id: _id });
    return Meteor.users.direct.remove({ _id });
  } else {
    return true;
  }
}

// 删除多个用户
export function removeUsers(_ids) {
  let isRemove = ProfilesCollection.remove({ _id: { $in: _ids } });
  if (isRemove) {
    Meteor.roleAssignment.remove({
      "user._id": {
        $in: _ids,
      },
    });
    // ArticleUserCollection.remove({ user_id: { $in: _ids } });
    // BookUserCollection.remove({ user_id: { $in: _ids } });
    // BroadcastUserCollection.remove({ user_id: { $in: _ids } });
    // EventUserCollection.remove({ user_id: { $in: _ids } });
    // NotificationUserCollection.remove({ user_id: _id });
    return Meteor.users.direct.remove({ _id: { $in: _ids } });
  } else {
    return true;
  }
}

// 激活多个用户
export function activation(_ids) {
  return ProfilesCollection.update(
    { _id: { $in: _ids } },
    {
      $set: {
        available: "active",
      },
    },
    { multi: true }
  );
}

// 注册用户
export function register(bodyParams) {
  id = Accounts.createUser({
    ...bodyParams,
    password: bodyParams.password || "123456",
  });
  return id;
}

// 获取当前用户信息
export function infoByCurrent({ userId, user }) {
  const roles = Meteor.roles
    .find(
      {
        _id: {
          $in: Roles.getRolesForUser(userId, {
            anyScope: true,
          }),
        },
      },
      {
        fields: {
          _id: 1,
          label: 1,
          type: 1,
          scope: 1,
          value: 1,
        },
      }
    )
    .fetch();
  const permissions = roles.filter((item) => item.type === "permission");
  return {
    user: _.omit(user, ["services"]),
    profile: user.profile(),
    roles: roles.filter((item) => item.type !== "permission"),
    permissions: permissions.map((item) => item),
  };
}

// 获取用户信息
export function info(_id) {
  const user = Meteor.users.findOne({ _id: _id });
  if (!user) {
    throw new Error("用户不存在");
  }
  const roles = Meteor.roles
    .find(
      {
        _id: {
          $in: Roles.getRolesForUser(user._id, {
            anyScope: true,
          }),
        },
      },
      {
        fields: {
          _id: 1,
          label: 1,
          type: 1,
          value: 1,
        },
      }
    )
    .fetch();
  const permissions = roles.filter((item) => item.type === "permission");
  return {
    user: _.omit(user, ["services"]),
    profile: user.profile(),
    roles: roles.filter((item) => item.type !== "permission"),
    permissions: permissions.map((item) => item),
  };
}

// 修改密码
export function changePassword({ userId, newPassword }) {
  return Accounts.setPassword(userId, newPassword);
}

// 分页查询数据
export function paginationByProfile(bodyParams) {
  if (bodyParams.selector && bodyParams.selector.username) {
    bodyParams.selector.username = {
      $regex: bodyParams.selector.username,
      $options: "i",
    };
  }
  return {
    data: ProfilesCollection.find(
      bodyParams.selector || {},
      bodyParams.options
    ).fetch(),
    total: ProfilesCollection.find(
      bodyParams.selector || {},
      bodyParams.options
    ).count(),
  };
}
