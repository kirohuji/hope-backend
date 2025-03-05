import { PostsCollection, Post } from "meteor/socialize:postable";
import Api from "../../api";
import { pagination, create } from "./service";
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
