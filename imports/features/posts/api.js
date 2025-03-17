import { PostsCollection, Post } from "meteor/socialize:postable";
import Constructor from "../base/api";
import Api from "../../api";
import {
  pagination,
  create,
  like,
  unlike,
  addComment,
  comments,
  detail,
} from "./service";
import {
  serverError500,
  success201,
  success200,
  badRequest400,
  notFound404,
} from "../base/api";

Api.addCollection(PostsCollection, {
  path: "posts",
});

Api.addRoute("posts", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return success201(
          create({
            scope: this.bodyParams.scope,
            user: this.user,
            userId: this.userId,
            bodyParams: this.bodyParams,
          })
        );
      } catch (e) {
        console.log(e);
        return badRequest400("Not Created");
      }
    },
  },
});

Api.addRoute("posts/:_id", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return success200(
          detail({
            postId: this.urlParams.id,
          })
        );
      } catch (e) {
        console.log(e);
        return notFound404();
      }
    },
  },
  delete: {
    authRequired: true,
    action: function () {
      try {
        const post = PostsCollection.findOne({ _id: this.urlParams.id });
        if(post){
          PostsCollection.remove({ _id: this.urlParams.id });
        }
        return success200(post);
      } catch (e) {
        return badRequest400({
          code: 400,
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
        console.log();
        return addComment({
          userId: this.userId,
          postId: this.urlParams._id || this.bodyParams._id,
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
