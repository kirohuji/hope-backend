import { PostsCollection, Post } from "meteor/socialize:postable";
import Constructor from "../base/api";
import Api from "../../api";
import {
  pagination,
  create,
  updatePost,
  deletePost,
  like,
  isLike,
  unlike,
  addComment,
  comments,
  detail,
} from "./service";
import { serverError500 } from "../base/api";

Api.addCollection(PostsCollection, {
  path: "posts",
});

Api.addRoute("posts", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return create({
          scope: this.bodyParams.scope,
          user: this.user,
          userId: this.userId,
          bodyParams: this.bodyParams,
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  }
});

Api.addRoute("posts/:_id", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return detail({
          postId: this.urlParams._id,
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
  patch: {
    authRequired: true,
    action: function () {
      try {
        return updatePost({
          postId: this.urlParams._id,
          bodyParams: this.bodyParams,
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
  delete: {
    authRequired: true,
    action: function () {
      try {
        return deletePost(this.urlParams._id);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("posts/pagination", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return pagination(this.bodyParams);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("posts/:_id/like", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return isLike({
          userId: this.userId,
          postId: this.urlParams._id,
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
  post: {
    authRequired: true,
    action: function () {
      try {
        return like({
          userId: this.userId,
          postId: this.urlParams._id,
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
  delete: {
    authRequired: true,
    action: function () {
      try {
        return unlike({
          userId: this.userId,
          postId: this.urlParams._id,
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("posts/:_id/comments", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return addComment({
          userId: this.userId,
          postId: this.urlParams._id,
          bodyParams: this.bodyParams,
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("posts/:_id/comments/pagination", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return comments({
          postId: this.urlParams._id,
          bodyParams: this.bodyParams,
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});
