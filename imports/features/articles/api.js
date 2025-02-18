import Api from "../../api";
import Model, {
  ArticleCollection,
  ArticleCommentCollection,
  ArticleUserCollection,
} from "./collection";
import {
  pagination,
  addAnswer,
  associateBookAndArticle,
  associateBookAndArticleByUpdate,
} from "./service";
import Constructor, { serverError500 } from "../base/api";
import _ from "lodash";

Api.addCollection(ArticleCollection, {
  path: "articles",
});

Api.addCollection(ArticleUserCollection, {
  path: "articles/users",
});

Constructor("articles", Model);

// 分页查询数据
Api.addRoute("articles/pagination", {
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

// 查询文章详情
Api.addRoute("articles/content/:_id", {
  get: function () {
    const artcle = ArticleCollection.findOne({
      _id: this.urlParams._id,
    });
    const profile = Meteor.users.findOne({ _id: artcle.author_id }).profile();

    return {
      ...artcle,
      comments: ArticleCommentCollection.find({
        artcle_id: this.urlParams._id,
      }).fetch(),
      author: {
        name: profile.displayName,
        avatarUrl: profile.photoURL,
      },
    };
  },
});

// 查询文章详情
Api.addRoute("articles/comments/users/current", {
  post: {
    authRequired: true,
    action: function () {
      return ArticleCommentCollection.insert({
        user_id: this.userId,
        ...this.bodyParams,
      });
    },
  },
});

// 查询文章详情
Api.addRoute("articles/users/current/:_id", {
  get: {
    authRequired: true,
    action: function () {
      const artcleUser = ArticleUserCollection.findOne({
        article_id: this.urlParams._id,
        user_id: this.userId,
      });
      return (
        artcleUser || {
          article_id: this.urlParams._id,
          user_id: this.userId,
          answers: [],
        }
      );
    },
  },
});

// 添加答案
Api.addRoute("articles/users/current", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return addAnswer({
          articleUserId: this.bodyParams._id,
          article_id: this.bodyParams.article_id,
          userId: this.userId,
          answers: this.bodyParams.answers,
          hasComments: this.bodyParams.hasComments,
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

// 书籍和文章的关联
Api.addRoute("books/:_id/article", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return associateBookAndArticle({
          book_id: this.urlParams._id,
          bodyParams: this.bodyParams,
          user: this.user,
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

// 书籍和文章的关联
Api.addRoute("books/:_id/article/update", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return associateBookAndArticleByUpdate({
          book_id: this.urlParams._id,
          article_id: this.bodyParams.article_id,
          bodyParams: this.bodyParams,
          user: this.user,
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
