import Api from "../../api";
import Constructor, { serverError500 } from "../base/api";
import Model, { BookCollection, BookUserCollection } from "./collection";
import {
  pagination,
  publish,
  unPublish,
  associateBookAndUser,
  updateStatus,
  play,
  getCurrentReadBook,
  select,
  getBookDates,
  getBookStartArticle,
  signInArticle,
  getBookUserDetails,
  getBookSummarize,
  getBookArticles,
} from "./service";

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
      try {
        return getBookDates(this.urlParams.bookId);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("books/users/current/start", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return getBookStartArticle({
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

Api.addRoute("books/users/current/signIn/:_id", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return signInArticle({
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
      try {
        return BookUserCollection.remove({
          user_id: this.userId,
          book_id: this.urlParams.bookId,
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
  get: {
    authRequired: true,
    action: function () {
      try {
        return getBookUserDetails({
          userId: this.userId,
          bookId: this.urlParams.bookId,
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

Api.addRoute("books/users/current/:bookId/summarize", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return getBookSummarize({
          userId: this.userId,
          bookId: this.urlParams.bookId,
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
      try {
        return getBookArticles({
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
