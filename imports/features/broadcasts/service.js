import { ProfilesCollection } from "meteor/socialize:user-profile";
import BroadcastCollection, {
  BroadcastUser,
  BroadcastUserCollection,
} from "./collection";
import _ from "lodash";

// 分页查询数据
export function pagination(bodyParams) {
  let data = BroadcastCollection.find(
    _.pickBy(bodyParams.selector) || {},
    bodyParams.options
  );
  return {
    data: data.fetch().map((item) => {
      return {
        ...item,
        leaders: item.leaders
          ? Meteor.users
              .find(
                {
                  _id: {
                    $in: item.leaders,
                  },
                },
                {
                  fields: {
                    photoURL: 1,
                    username: 1,
                    realName: 1,
                    displayName: 1,
                    phoneNumber: 1,
                  },
                }
              )
              .fetch()
          : [],
      };
    }),
    total: data.count(),
  };
}

// 统计人数
export function count(broadcast_id) {
  return BroadcastUserCollection.find({ broadcast_id }).count();
}

// 获取当前数据下所有的用户
export function users(broadcast_id) {
  return _.compact(
    BroadcastUserCollection.find({
      broadcast_id: broadcast_id,
    }).map((broadcastUser) => {
      const user = ProfilesCollection.findOne(
        {
          _id: broadcastUser.user_id,
        },
        {
          fields: {
            realName: 1,
            email: 1,
            displayName: 1,
            usename: 1,
            photoURL: 1,
          },
        }
      );
      if (user) {
        return {
          broadcast_id,
          user_id: user._id,
          status: broadcastUser.status,
          profile: user,
        };
      }
    })
  );
}

// 签到
export function signIn({ broadcast_id, user_id }) {
  return BroadcastUserCollection.update(
    {
      broadcast_id,
      user_id,
    },
    {
      status: "signIn",
      broadcast_id,
      user_id,
    }
  );
}

// 退出
export function signOut({ broadcast_id, user_id }) {
  return BroadcastUserCollection.update(
    {
      broadcast_id,
      user_id,
    },
    {
      status: "signOut",
      broadcast_id,
      user_id,
    }
  );
}

// 删除用户
export function removeUser({ broadcast_id, user_id }) {
  return BroadcastUserCollection.remove({
    broadcast_id,
    user_id,
  });
}

// 发布
export function publish(broadcast_id) {
  return BroadcastCollection.update(
    {
      _id: broadcast_id,
    },
    {
      $set: {
        published: true,
      },
    }
  );
}

// 发布
export function unPublish(broadcast_id) {
  return BroadcastCollection.update(
    {
      _id: broadcast_id,
    },
    {
      $set: {
        published: false,
      },
    }
  );
}

export function addUsers({ broadcast_id, users_id, currentUserId }) {
  if (Array.isArray(users_id) && users_id.length > 0) {
    return _.compact(
      users_id.map((user_id) => {
        const broadcastUser = BroadcastUserCollection.findOne({
          broadcast_id,
          user_id,
        });
        if (!broadcastUser) {
          let model = new BroadcastUser({
            broadcast_id,
            user_id,
            createdBy: currentUserId,
          });
          model.save();
          const user = ProfilesCollection.findOne(
            {
              _id: model.user_id,
            },
            {
              fields: {
                realName: 1,
                email: 1,
                displayName: 1,
                usename: 1,
                photoURL: 1,
              },
            }
          );
          if (user) {
            return {
              broadcast_id,
              user_id: user._id,
              status: model.status,
              profile: user,
            };
          }
        }
      })
    );
  } else {
    return [];
  }
  // return BroadcastCollection.update({
  //   _id: broadcast_id,
  // }, {
  //   $set: {
  //     published: false
  //   }
  // })
}
