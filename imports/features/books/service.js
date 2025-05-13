import { BookCollection, BookUserCollection } from "./collection";
import {
  BookArticleCollection,
  ArticleCollection,
  ArticleUserCollection,
} from "../articles/collection";
import { ProfilesCollection } from "meteor/socialize:user-profile";
import _ from "lodash";
import moment from "moment";

export function findOne(bodyParams) {
  return BookCollection.findOne(bodyParams.selector || {}, bodyParams.options);
}

// 分页查询数据
export function pagination(bodyParams) {
  let curror = BookCollection.find(
    _.pickBy(bodyParams.selector) || {},
    bodyParams.options
  );
  return {
    data: curror.fetch(),
    total: curror.count(),
  };
}

// 获取书籍日期
export function getBookDates(bookId) {
  return BookArticleCollection.find({
    book_id: bookId,
  }).map((item) => moment(item.date).format("YYYY/MM/DD"));
}

// 获取开始文章
export function getBookStartArticle({ userId, date }) {
  let bookUser = BookUserCollection.findOne({
    user_id: userId,
    status: "active",
  });
  let article = BookArticleCollection.findOne({
    book_id: bookUser?.book_id,
    date: date && moment(date).format("YYYY/MM/DD"),
  });
  return article || false;
}

// 文章签到
export function signInArticle({ articleId, userId }) {
  let articleUser = ArticleUserCollection.findOne({
    article_id: articleId,
    user_id: userId,
  });
  let signIn = ArticleUserCollection.update(
    {
      article_id: articleId,
      user_id: userId,
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
      publisher_id: userId,
      createdAt: new Date(),
      category: "Training",
    });
    return true;
  }
  return false;
}

// 获取书籍用户详情
export function getBookUserDetails({ userId, bookId }) {
  let bookUser = BookUserCollection.find({
    user_id: userId,
    book_id: bookId,
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
  }
  return [];
}

// 获取书籍总结
export function getBookSummarize({ userId, bookId }) {
  let bookUser = BookUserCollection.findOne({
    user_id: userId,
    book_id: bookId,
  });
  if (bookUser) {
    const book = BookCollection.findOne(
      { _id: bookId },
      {
        fields: {
          label: 1,
          cover: 1,
        },
      }
    );
    if (book) {
      const total = BookArticleCollection.find({
        book_id: bookId,
      });

      let selector = {
        article_id: { $in: total.map((i) => i.article_id) },
        user_id: userId,
        completedDate: {
          $exists: true,
        },
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
    }
  }
  return {
    total: 0,
    inProcess: 0,
  };
}

// 获取书籍文章
export function getBookArticles({ bookId }) {
  let articles = BookArticleCollection.find({
    book_id: bookId,
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
}

// 发布
export function publish(book_id) {
  return BookCollection.update(
    {
      _id: book_id,
    },
    {
      $set: {
        published: true,
        publishedDate: new Date(),
      },
    }
  );
}

// 取消发布
export function unPublish(book_id) {
  return BookCollection.update(
    {
      _id: book_id,
    },
    {
      $set: {
        published: false,
      },
    }
  );
}

// 关联书籍和用户
export function associateBookAndUser({ userId, bookId }) {
  BookUserCollection.remove({
    user_id: userId,
  });
  return BookUserCollection.upsert(
    {
      user_id: userId,
      book_id: bookId,
    },
    {
      user_id: userId,
      book_id: bookId,
    }
  );
}

// 修改状态
export function updateStatus({ userId, bookId, status }) {
  BookUserCollection.update(
    {
      user_id: userId,
    },
    {
      $set: { status: "none" },
    },
    {
      multi: true,
    }
  );
  return BookUserCollection.update(
    {
      user_id: userId,
      book_id: bookId,
    },
    {
      $set: { status },
    }
  );
}

// 播放
export function play({ userId, date }) {
  let book = null;
  let bookUser = BookUserCollection.findOne({
    user_id: userId,
    status: "active",
  });
  let bookArticle = null;
  let article = null;
  let articleList = [];
  if (bookUser) {
    book = BookCollection.findOne(
      { _id: bookUser.book_id },
      {
        fields: {
          label: 1,
          cover: 1,
        },
      }
    );
    if (book) {
      if (bookUser.select_article_id) {
        article = ArticleCollection.findOne(
          { _id: bookUser.select_article_id },
          {
            fields: {
              title: 1,
              description: 1,
              date: 1,
            },
          }
        );
      } else {
        bookArticle = BookArticleCollection.findOne({
          book_id: bookUser?.book_id,
          date: date
            ? moment(date).format("YYYY/MM//DD")
            : moment(new Date()).format("YYYY/MM//DD"),
        });
        if (bookArticle?.article_id) {
          article = ArticleCollection.findOne(
            { _id: bookArticle?.article_id },
            {
              fields: {
                title: 1,
                description: 1,
                date: 1,
              },
            }
          );
        }
      }
      articleList = BookArticleCollection.find(
        {
          book_id: bookUser?.book_id,
        },
        {
          sort: { date: -1 },
        }
      ).map((i) =>
        ArticleCollection.findOne(
          {
            published: true,
            _id: i.article_id,
          },
          {
            fields: {
              title: 1,
              description: 1,
              date: 1,
            },
          }
        )
      );
      return {
        book,
        article,
        list: _.compact(articleList),
      };
    }
  }
  return false;
}

// 获取当前阅读书籍
export function getCurrentReadBook(userId) {
  let bookUser = BookUserCollection.find({
    user_id: userId,
  });
  if (bookUser) {
    return _.compact(
      bookUser.map((item) => {
        let book = BookCollection.findOne({
          _id: item.book_id,
        });
        if (book) {
          return {
            ...book,
            createdUser: ProfilesCollection.findOne(
              { _id: book.createdBy },
              { realName: 1, displayName: 1 }
            ),
            currentStatus: item.status,
          };
        }
        return null;
      })
    );
  }
  return {};
}

// 选择文章
export function select({ userId, article_id, book_id }) {
  let bookUser = BookUserCollection.find({
    book_id: book_id,
    user_id: userId,
  });
  if (bookUser) {
    return BookUserCollection.update(
      {
        book_id: book_id,
        user_id: userId,
      },
      {
        $set: {
          select_article_id: article_id,
        },
      }
    );
  }
  return false;
}
