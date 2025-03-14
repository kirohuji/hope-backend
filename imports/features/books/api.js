import Api from "../../api";
import Constructor, { serverError500 } from "../base/api";
import { ProfilesCollection } from "meteor/socialize:user-profile";
import Model, { BookCollection, BookUserCollection } from "./collection";
import {
  BookArticleCollection,
  ArticleCollection,
  ArticleUserCollection,
} from "../articles/collection";
import {
  pagination,
  publish,
  unPublish,
  associateBookAndUser,
  updateStatus,
  play,
  getCurrentReadBook,
  select,
} from "./service";
import moment from "moment";
import _ from "lodash";

Api.addCollection(BookUserCollection, {
  path: "books/users",
});

Api.addCollection(BookCollection);

Constructor("books", Model);

Api.addRoute("books/pagination", {
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

Api.addRoute("books/:bookId/dates", {
  post: {
    authRequired: true,
    action: function () {
      return BookArticleCollection.find({
        book_id: this.urlParams.bookId,
      }).map((item) => moment(item.date).format("YYYY/MM/DD"));
    },
  },
});

Api.addRoute("books/users/current/start", {
  post: {
    authRequired: true,
    action: function () {
      let bookUser = BookUserCollection.findOne({
        user_id: this.userId,
        status: "active",
      });
      let article = BookArticleCollection.findOne({
        book_id: bookUser?.book_id,
        date:
          this.bodyParams.date &&
          moment(this.bodyParams.date).format("YYYY/MM/DD"),
      });
      return article || false;
    },
  },
});

Api.addRoute("books/users/current/signIn/:_id", {
  post: {
    authRequired: true,
    action: function () {
      let articleUser = ArticleUserCollection.findOne({
        article_id: this.urlParams._id,
        user_id: this.userId,
      });
      let signIn = ArticleUserCollection.update(
        {
          article_id: this.urlParams._id,
          user_id: this.userId,
        },
        {
          ...articleUser,
          signIn: true,
        }
      );
      if (signIn) {
        Meteor.notifications.insert({
          type: "training",
          title: "<p>签到成功</p>",
          isUnRead: true,
          publisher_id: this.userId,
          createdAt: new Date(),
          category: "Training",
        });
        return true;
      }
    },
  },
});

Api.addRoute("books/users/current", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return getCurrentReadBook(this.userId);
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
        return associateBookAndUser({
          userId: this.userId,
          bookId: this.bodyParams.book_id,
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
        return updateStatus({
          userId: this.userId,
          bookId: this.bodyParams.book_id,
          status: this.bodyParams.status,
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

Api.addRoute("books/users/current/:bookId", {
  delete: {
    authRequired: true,
    action: function () {
      return BookUserCollection.remove({
        user_id: this.userId,
        book_id: this.urlParams.bookId,
      });
    },
  },
  get: {
    authRequired: true,
    action: function () {
      let bookUser = BookUserCollection.find({
        user_id: this.userId,
        book_id: this.urlParams.bookId,
      });
      if (bookUser) {
        return bookUser.map((item) => {
          let book = BookCollection.findOne({
            _id: item.book_id,
          });
          return {
            ...book,
            createdUser: ProfilesCollection.findOne(
              { _id: book.createdBy },
              { fields: { realName: 1, displayName: 1 } }
            ),
            currentStatus: item.status,
          };
        });
      } else {
        return [];
      }
    },
  },
});

Api.addRoute("books/users/current/:bookId/summarize", {
  get: {
    authRequired: true,
    action: function () {
      let bookUser = BookUserCollection.findOne({
        user_id: this.userId,
        book_id: this.urlParams.bookId,
      });
      if (bookUser) {
        book = BookCollection.findOne(
          { _id: this.urlParams.bookId },
          {
            fields: {
              label: 1,
              cover: 1,
            },
          }
        );
        if (book) {
          const total = BookArticleCollection.find({
            book_id: this.urlParams.bookId,
          });

          let selector = {
            article_id: { $in: total.map((i) => i.article_id) },
            user_id: this.userId,
            completedDate: {
              $exists: true,
            },
            // $where: "this.answers.length>0",
          };
          let articleUser = ArticleUserCollection.find(selector);
          const completeArticle = ArticleCollection.find({
            published: true,
            _id: {
              $in: articleUser.fetch().map((item) => item.article_id),
            },
          })
            .fetch()
            .map((item) => moment(item.date).format("YYYY/MM/DD"));

          return {
            total: total.count(),
            inProcess: articleUser.count(),
            days: completeArticle || [],
          };
        } else {
          return {
            total: 0,
            inProcess: 0,
          };
        }
      } else {
        return {
          total: 0,
          inProcess: 0,
        };
      }
    },
  },
});

Api.addRoute("books/users/current/play", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return play({
          userId: this.userId,
          date: this.bodyParams.date,
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

Api.addRoute("books/articles/pagination", {
  post: {
    authRequired: true,
    action: function () {
      let articles = BookArticleCollection.find({
        book_id: this.bodyParams.book_id,
      }).map((item) => item.article_id);
      return ArticleCollection.find(
        {
          _id: { $in: articles },
        },
        {
          sort: {
            date: 1,
          },
        }
      ).fetch();
    },
  },
});

Api.addRoute("books/:bookId/publish", {
  post: function () {
    try {
      return publish(this.urlParams.bookId);
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

Api.addRoute("books/:bookId/unpublish", {
  post: function () {
    try {
      return unPublish(this.urlParams.bookId);
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

Api.addRoute("books/:bookId/select", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return select({
          book_id: this.urlParams.bookId,
          article_id: this.bodyParams.article_id,
          userId: this.userId,
          status: "active",
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
