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
  getArticleContent,
  getArticleUser,
  createArticleComment,
} from "./service";
import Constructor, { serverError500 } from "../base/api";

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
    try {
      return getArticleContent(this.urlParams._id);
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

// 创建文章评论
Api.addRoute("articles/comments/users/current", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return createArticleComment({
          userId: this.userId,
          ...this.bodyParams,
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

// 获取用户文章信息
Api.addRoute("articles/users/current/:_id", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return getArticleUser({
          articleId: this.urlParams._id,
          userId: this.userId,
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

// 书籍和文章的关联更新
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
