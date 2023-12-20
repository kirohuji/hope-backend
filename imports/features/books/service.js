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

// 发布
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
