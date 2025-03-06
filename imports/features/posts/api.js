import { PostsCollection, Post } from "meteor/socialize:postable";
import Api from "../../api";
import { pagination, create, like, unlike, addComment } from "./service";
import { serverError500, success201, badRequest400 } from "../base/api";

Api.addCollection(PostsCollection);

Api.addRoute("posts/pagination", {
  post: function () {
    try {
      return pagination(this.bodyParams);
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
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
