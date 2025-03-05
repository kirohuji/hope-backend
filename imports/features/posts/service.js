import { PostsCollection, Post } from "meteor/socialize:postable";
import { ProfilesCollection } from "meteor/socialize:user-profile";
import SimpleSchema from "simpl-schema";
import _ from "lodash";

Post.attachSchema({
  posterId: {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
    autoValue: null,
    index: 1,
    denyUpdate: true,
  },
});
// 分页查询数据
export function pagination(bodyParams) {
  let curror = PostsCollection.find(
    _.pickBy(bodyParams.selector) || {},
    bodyParams.options
  );
  const data = curror.fetch();
  const createdByIds = _.map(data, "createdBy");
  const users = ProfilesCollection.find({ _id: { $in: createdByIds } }).fetch();
  const userMap = _.keyBy(users, "_id");
  const enhancedData = data.map((item) => {
    const user = userMap[item.createdBy]; // 使用字典查找用户信息
    return {
      ...item,
      createdUser: user && user.realName, // 假设你要显示用户的 name
    };
  });
  return {
    data: enhancedData,
    total: curror.count(),
  };
}

export function create({ userId, bodyParams }) {
  const usersFeed = this.user.feed();
  const post = new Post({
    body: bodyParams.body,
    posterId: userId,
    ...usersFeed.getLinkObject(),
  }).save();
  return post;
}
