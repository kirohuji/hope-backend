import { PostsCollection, Post } from "meteor/socialize:postable";
import { LikesCollection, Like } from "meteor/socialize:likeable";
import { CommentsCollection, Comment } from "meteor/socialize:commentable";
import { ProfilesCollection } from "meteor/socialize:user-profile";
import Audit from "../audits/collection";
import _ from "lodash";
import moment from "moment";

// 分页查询数据
export function pagination(bodyParams) {
  if (bodyParams.selector && bodyParams.selector.status == "all") {
    bodyParams.selector = _.pickBy(_.omit(bodyParams.selector, ["status"]));
  }
  if (
    bodyParams.selector &&
    bodyParams.selector.category &&
    bodyParams.selector.category.length === 0
  ) {
    bodyParams.selector = _.pickBy(_.omit(bodyParams.selector, ["category"]));
  } else if (
    bodyParams.selector &&
    bodyParams.selector.category &&
    bodyParams.selector.category.length > 0
  ) {
    bodyParams.selector = {
      ..._.pickBy(bodyParams.selector),
      category: {
        $in: bodyParams.selector.category,
      },
    };
  }
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

export function create({ scope, user, userId, bodyParams }) {
  const usersFeed = user.feed();
  const body = Meteor.checkProfanity(bodyParams.body);
  const post = new Post({
    ...bodyParams,
    body,
    posterId: userId,
    scope: scope,
    status: bodyParams.published ? "pending_review" : "draft",
    ...usersFeed.getLinkObject(),
    publishedAt: bodyParams.published ? moment(new Date()).toISOString() : "",
  }).save();
  if(bodyParams.published){
    new Audit({
      sourceId: post._id,
      userId: userId,
      label: "发布",
      description: "发布了一篇文章",
      status: "in_review",
      category: "内容分享",
      createdBy: userId,
      scope: scope,
    }).save();;
  }
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

export function detail({ postId }) {
  const post = PostsCollection.findOne({ _id: postId });
  const user = ProfilesCollection.findOne({ _id: post.posterId });
  return {
    ...post,
    poster: user,
  };
}

export function comments({ postId, bodyParams }) {
  let comments = CommentsCollection.find(
    {
      linkedObjectId: postId,
      objectType: "socialize:posts",
      ..._.pickBy(bodyParams.selector),
    },
    bodyParams.options
  ).fetch();
  const createdByIds = _.map(comments, "userId");
  const users = ProfilesCollection.find({ _id: { $in: createdByIds } }).fetch();
  const userMap = _.keyBy(users, "_id");
  const enhancedData = comments.map((comment) => {
    const user = userMap[comment.userId]; // 使用字典查找用户信息
    return {
      ...comment,
      author: user || {}, // 假设你要显示用户的 name
    };
  });
  return {
    data: enhancedData,
    total: CommentsCollection.find(bodyParams.selector).count(),
  };
}
