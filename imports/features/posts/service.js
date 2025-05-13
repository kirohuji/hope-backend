import { PostsCollection, Post } from "meteor/socialize:postable";
import { LikesCollection, Like } from "meteor/socialize:likeable";
import { CommentsCollection, Comment } from "meteor/socialize:commentable";
import { ProfilesCollection } from "meteor/socialize:user-profile";
import Audit from "../audits/collection";
import _ from "lodash";
import moment from "moment";

// 分页查询数据
export function pagination(bodyParams) {
  try {
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
      const user = userMap[item.posterId];
      return {
        ...item,
        poster: user,
      };
    });
    return {
      data: enhancedData,
      total: PostsCollection.find(bodyParams.selector).count(),
    };
  } catch (error) {
    throw new Error(`Failed to paginate posts: ${error.message}`);
  }
}

export function create({ scope, user, userId, bodyParams }) {
  try {
    const usersFeed = user.feed();
    const body = Meteor.checkProfanity(bodyParams.body, true);
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
      }).save();
    }
    return post;
  } catch (error) {
    throw new Error(`Failed to create post: ${error.message}`);
  }
}

export function updatePost({ postId, bodyParams }) {
  try {
    const body = Meteor.checkProfanity(bodyParams.body, true);
    PostsCollection.update(
      { _id: postId },
      {
        $set: {
          ...bodyParams,
          body,
        }
      }
    );
    return PostsCollection.findOne(postId);
  } catch (error) {
    throw new Error(`Failed to update post: ${error.message}`);
  }
}

export function deletePost(postId) {
  try {
    const post = PostsCollection.findOne({ _id: postId });
    if (post) {
      PostsCollection.remove({ _id: postId });
    }
    return post;
  } catch (error) {
    throw new Error(`Failed to delete post: ${error.message}`);
  }
}

export function like({ userId, postId }) {
  try {
    const post = PostsCollection.findOne({ _id: postId });
    if (!post) {
      throw new Error('Post not found');
    }
    const like = new Like({
      userId: userId,
      ...post.getLinkObject(),
    }).save();
    return like;
  } catch (error) {
    throw new Error(`Failed to like post: ${error.message}`);
  }
}

export function isLike({ userId, postId }) {
  try {
    const like = LikesCollection.findOne({
      userId: userId,
      linkedObjectId: postId,
    });
    return like || false;
  } catch (error) {
    throw new Error(`Failed to check like status: ${error.message}`);
  }
}

export function unlike({ userId, postId }) {
  try {
    const like = LikesCollection.findOne({
      userId: userId,
      linkedObjectId: postId,
    });
    if (like) {
      like.remove();
    }
    return like;
  } catch (error) {
    throw new Error(`Failed to unlike post: ${error.message}`);
  }
}

export function addComment({ userId, postId, bodyParams }) {
  try {
    const post = PostsCollection.findOne({ _id: postId });
    if (!post) {
      throw new Error('Post not found');
    }
    const comment = new Comment({
      userId: userId,
      body: bodyParams.body,
      ...post.getLinkObject(),
    }).save();
    return comment;
  } catch (error) {
    throw new Error(`Failed to add comment: ${error.message}`);
  }
}

export function detail({ postId }) {
  try {
    const post = PostsCollection.findOne({ _id: postId });
    if (!post) {
      throw new Error('Post not found');
    }
    const user = ProfilesCollection.findOne({ _id: post.posterId });
    return {
      ...post,
      poster: user,
    };
  } catch (error) {
    throw new Error(`Failed to get post details: ${error.message}`);
  }
}

export function comments({ postId, bodyParams }) {
  try {
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
      const user = userMap[comment.userId];
      return {
        ...comment,
        author: user || {},
      };
    });
    return {
      data: enhancedData,
      total: CommentsCollection.find(bodyParams.selector).count(),
    };
  } catch (error) {
    throw new Error(`Failed to get comments: ${error.message}`);
  }
}
