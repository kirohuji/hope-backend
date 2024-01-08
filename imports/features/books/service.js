import Model, {
  BookCollection,
  BookPostCollection,
  BookPostQuestionCollection,
  BookPost,
  BookUserCollection,
} from "./collection";
import {
  BookArticleCollection,
  ArticleCollection,
  ArticleUserCollection,
} from "../articles/collection";
import { ProfilesCollection } from "meteor/socialize:user-profile";
import { unified } from "unified";
import parse from "rehype-parse";
import slug from "rehype-slug";
import toc from "@jsdevtools/rehype-toc";
import stringify from "rehype-stringify";
import _ from "lodash";
import moment from "moment";
const processor = unified()
  .use(parse)
  .use(slug)
  .use(toc, {
    nav: false,
  })
  .use(stringify);

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
    console.log("select_article_id", bookUser);
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
        console.log("bookArticle", bookArticle);
        article = ArticleCollection.findOne(
          { _id: bookArticle.article_id },
          {
            fields: {
              title: 1,
              description: 1,
              date: 1,
            },
          }
        );
      }
      console.log("article", article);
      // 优化
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
    } else {
      return false;
    }
  } else {
    return false;
  }
}

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
        } else {
          return null;
        }
      })
    );
  } else {
    return {};
  }
}

export function select({ userId, article_id, book_id }) {
  let bookUser = BookUserCollection.find({
    book_id: book_id,
    user_id: userId,
  });
  if (bookUser) {
    console.log("book_id", book_id);
    console.log("userId", userId);
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
}
