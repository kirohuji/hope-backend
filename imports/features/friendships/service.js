import { Friend, FriendsCollection } from "meteor/socialize:friendships";
import { Request, RequestsCollection } from "meteor/socialize:requestable";
import { ProfilesCollection } from "meteor/socialize:user-profile";
import _ from "lodash";

// 获取好友列表
export function getFriends({ user, options }) {
  return user.friends(options || { sort: { createdAt: -1 } }).fetch();
}

// 获取好友用户列表
export function getFriendsAsUsers({ user, options }) {
  const ids = user
    .friendsAsUsers(options || { sort: { createdAt: -1 } })
    .map((item) => item._id);
  const ids2 = Meteor.users
    .find({ _id: { $nin: [user._id] } })
    .map((item) => item._id);
  return ProfilesCollection.find(
    { _id: { $in: _.uniq([...ids, ...ids2]) } },
    {
      fields: {
        _id: 1,
        username: 1,
        displayName: 1,
        username: 1,
        realName: 1,
      },
    }
  ).fetch();
}

// 删除好友
export function unfriend({ userId, friendId }) {
  const friend = FriendsCollection.findOne({
    userId: userId,
    friendId: friendId,
  });
  friend && friend.remove();
  return true;
}

// 检查是否是好友
export function isFriendsWith({ userId, friendId }) {
  return !!FriendsCollection.findOne({
    userId: userId,
    friendId: friendId,
  });
}

// 获取好友请求列表
export function getFriendRequests({ user, options }) {
  try {
    return user.friendRequests(options || {}).map((item) => {
      return {
        ...item,
        ...ProfilesCollection.findOne({ _id: item.requesterId }),
      };
    });
  } catch (e) {
    return false;
  }
}

// 获取好友请求数量
export function getNumFriendRequests({ user }) {
  try {
    return user.friendRequests().count();
  } catch (e) {
    return false;
  }
}

// 检查是否有来自指定用户的好友请求
export function hasFriendshipRequestFrom({ user, friendId }) {
  try {
    return user.hasFriendshipRequestFrom({ _id: friendId });
  } catch (e) {
    return false;
  }
}

// 发送好友请求
export function requestFriendship({ userId, friendId }) {
  return RequestsCollection.insert(
    new Request({
      ...Meteor.users.findOne({ _id: friendId }).getLinkObject(),
      type: "friend",
    }),
    {
      extendAutoValueContext: {
        userId: userId,
      },
    }
  );
}

// 取消好友请求
export function cancelFriendshipRequest({ user, friendId }) {
  try {
    return user.cancelFriendshipRequest({ _id: friendId });
  } catch (e) {
    return false;
  }
}

// 接受好友请求
export function acceptFriendshipRequest({ userId, friendId }) {
  const request = RequestsCollection.findOne({
    type: "friend",
    requesterId: friendId,
    linkedObjectId: userId,
  });
  /** 添加一条记录 */
  const freindId = FriendsCollection.direct.insert(
    new Friend({
      userId: userId,
      friendId: request.requesterId,
      createdAt: new Date(),
    })
  );
  /** 互相添加 */
  const user = Meteor.users.findOne({ _id: friendId });
  const friend = Meteor.users.findOne({ _id: userId });

  if (friend.hasFriendshipRequestFrom(user)) {
    RequestsCollection.remove({
      linkedObjectId: userId,
      requesterId: request.requesterId,
      type: "friend",
    });
    RequestsCollection.remove({
      linkedObjectId: request.requesterId,
      requesterId: userId,
      type: "friend",
    });
    FriendsCollection.direct.insert({
      userId: request.requesterId,
      friendId: userId,
      createdAt: new Date(),
    });
  }
  return freindId;
}

// 拒绝好友请求
export function denyFriendshipRequest({ userId, friendId }) {
  try {
    const request = RequestsCollection.findOne({
      type: "friend",
      requesterId: friendId,
      linkedObjectId: userId,
    });
    request && request.deny();
    return true;
  } catch (e) {
    return false;
  }
}

// 忽略好友请求
export function ignoreFriendshipRequest({ userId, friendId }) {
  try {
    const request = RequestsCollection.findOne({
      type: "friend",
      requesterId: friendId,
      linkedObjectId: userId,
    });
    request && request.ignore();
    return true;
  } catch (e) {
    return false;
  }
} 