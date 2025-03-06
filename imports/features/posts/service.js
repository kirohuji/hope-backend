import { PostsCollection, Post } from "meteor/socialize:postable";
import { LikesCollection, Like } from "meteor/socialize:likeable";
import { CommentsCollection, Comment } from "meteor/socialize:commentable";
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
  scope: {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
  },
});
Like.attachSchema({
  userId: {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
    autoValue: null,
    index: 1,
    denyUpdate: true,
  },
});
Comment.attachSchema({
  userId: {
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
  const createdByIds = _.map(data, "posterId");
  const users = ProfilesCollection.find({ _id: { $in: createdByIds } }).fetch();
  const userMap = _.keyBy(users, "_id");
  const enhancedData = data.map((item) => {
    const user = userMap[item.posterId]; // 使用字典查找用户信息
    return {
      ...item,
      poster: user, // 假设你要显示用户的 name
    };
  });
  return {
    data: enhancedData,
    total: PostsCollection.find(bodyParams.selector).count(),
  };
}

LikesCollection._hookAspects.insert.after = [];
LikesCollection._hookAspects.remove.after = [];
LikesCollection.after.insert(function afterInsert(userId, like) {
  const collection = this.transform().getCollectionForParentLink();
  like.userId &&
    collection &&
    collection.update({ _id: like.linkedObjectId }, { $inc: { likeCount: 1 } });
});

LikesCollection.after.remove(function afterRemove(userId, like) {
  const collection = this.transform().getCollectionForParentLink();
  like.userId &&
    collection &&
    collection.update(
      { _id: like.linkedObjectId },
      { $inc: { likeCount: -1 } }
    );
});

export function create({ scope, user, userId, bodyParams }) {
  const usersFeed = user.feed();
  const post = new Post({
    body: bodyParams.body,
    posterId: userId,
    scope: scope,
    ...usersFeed.getLinkObject(),
  }).save();
  return post;
}

export function like({ userId, postId }) {
  const post = PostsCollection.findOne({ _id: postId });
  const like = new Like({
    userId: userId,
    ...post.getLinkObject(),
  }).save();
  return like;
}

export function unlike({ userId, postId }) {
  const like = LikesCollection.findOne({
    userId: userId,
    linkedObjectId: postId,
  });
  like && like.remove();
  return like;
}

export function addComment({ userId, postId, bodyParams }) {
  const post = PostsCollection.findOne({ _id: postId });
  const comment = new Comment({
    userId: userId,
    body: bodyParams.body,
    ...post.getLinkObject(),
  }).save();
  return comment;
}
