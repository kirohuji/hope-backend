import { ArticleCollection, BookArticleCollection } from "./collection";
import { createQuery } from "meteor/cultofcoders:grapher";
export const FilteredDataQuery = createQuery({
  // 指定主要的集合为 BookArticleCollection
  collection: "books_articles",

  // 定义查询条件
  selector: {
    book_id: "{{selector.book_id}}", // 使用 Grapher 的模板字符串
  },

  // 连接 ArticleCollection 集合以获取文章发布状态
  children: {
    articles: {
      collection: "articles",
      $filter({ filters, params }) {
        filters.published = params.selector.published;
      },
    },
  },

  // 格式化返回结果
  $formatResult({ result, options }) {
    return {
      data: result,
      total: options.total, // 返回符合条件的数据总数
    };
  },

  // 在聚合管道中添加计算总数的操作
  $total: true,
});
