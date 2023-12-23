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
import { unified } from "unified";
import parse from "rehype-parse";
import slug from "rehype-slug";
import toc from "@jsdevtools/rehype-toc";
import stringify from "rehype-stringify";
import _ from "lodash";
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
      book_id: bookId
    },
    {
      $set: { status, },
    }
  );
}
