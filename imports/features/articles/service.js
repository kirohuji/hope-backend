import Model, {
  ArticleCollection,
  BookArticleCollection,
  ArticleCommentCollection,
  ArticleUserCollection,
} from "./collection";
import _ from "lodash";
import moment from "moment";
// 分页查询数据
export async function pagination(bodyParams) {
  let book_id = bodyParams.selector.book_id;
  if (book_id) {
    let match = {
      "article.title": bodyParams.selector.title,
      "article.published": bodyParams.selector.published,
    };
    if (bodyParams.selector && bodyParams.selector.published === "") {
      delete match["article.published"];
    }
    let bookArticles = await BookArticleCollection.rawCollection()
      .aggregate([
        { $match: { book_id: bodyParams.selector.book_id } },
        {
          $lookup: {
            from: "articles",
            localField: "article_id",
            foreignField: "_id",
            as: "article",
          },
        },
        { $unwind: "$article" },
        {
          $match: match,
        },
        {
          $project: {
            _id: "$article._id",
            title: "$article.title",
            published: "$article.published",
            date: "$article.date",
            decsription: "$article.decsription",
            coverUrl: "$article.coverUrl",
            view: "$article.view",
            createdBy: "$article.createdBy",
          },
        },
        { $sort: bodyParams.options.sort },
        { $skip: bodyParams.options.skip },
        { $limit: bodyParams.options.limit },
      ])
      .toArray();
    let total = await BookArticleCollection.rawCollection()
      .aggregate([
        { $match: { book_id: bodyParams.selector.book_id } },
        {
          $lookup: {
            from: "articles",
            localField: "article_id",
            foreignField: "_id",
            as: "article",
          },
        },
        { $unwind: "$article" },
        {
          $match: match,
        },
        {
          $project: {
            _id: "$article._id",
            title: "$article.title",
            published: "$article.published",
          },
        },
        { $count: "total" },
      ])
      .toArray();
    console.log("total", total);
    return {
      data: bookArticles,
      total: total.length > 0 ? total[0].total : 0,
    };
  } else {
    let curror = ArticleCollection.find(
      _.pickBy(bodyParams.selector) || {},
      bodyParams.options
    );
    return {
      data: curror.fetch(),
      total: ArticleCollection.find(
        _.pickBy(bodyParams.selector) || {}
      ).count(),
    };
  }
}

// 书籍和文章的关联
export function associateBookAndArticle({ book_id, bodyParams, user }) {
  const bookArticle = BookArticleCollection.findOne({
    book_id: book_id,
    date: bodyParams.date && moment(bodyParams.date).format("YYYY/MM//DD"),
  });
  if (bookArticle) {
    return BookArticleCollection.update(
      {
        book_id: book_id,
        date: bodyParams.date && moment(bodyParams.date).format("YYYY/MM//DD"),
      },
      {
        $set: {
          book_id: book_id,
          ...bodyParams,
          author: {
            name: user.username,
            avatarUrl: user.profile().photoURL,
          },
          date:
            bodyParams.date && moment(bodyParams.date).format("YYYY/MM//DD"),
        },
      }
    );
  } else {
    return BookArticleCollection.insert({
      book_id: book_id,
      ...bodyParams,
      author: {
        name: user.username,
        avatarUrl: user.profile().photoURL,
      },
      date: bodyParams.date && moment(bodyParams.date).format("YYYY/MM//DD"),
    });
  }
}

// 书籍和文章的关联
export function associateBookAndArticleByUpdate({
  book_id,
  article_id,
  bodyParams,
  user,
}) {
  return BookArticleCollection.update(
    {
      book_id: book_id,
      article_id: article_id,
    },
    {
      ...bodyParams,
      author: {
        name: user.username,
        avatarUrl: user.profile().photoURL,
      },
      date: bodyParams.date && moment(bodyParams.date).format("YYYY/MM//DD"),
    }
  );
}

// 添加答案
export function addAnswer({
  articleUserId,
  article_id,
  userId,
  answers,
  hasComments,
  bodyParams,
}) {
  if (articleUserId) {
    return ArticleUserCollection.upsert(
      {
        _id: articleUserId,
      },
      {
        completedDate: moment(new Date()).format("YYYY/MM/DD"),
        article_id: article_id,
        user_id: userId,
        answers: answers,
      }
    );
  } else {
    return ArticleUserCollection.insert({
      article_id: article_id,
      user_id: userId,
      answers: answers,
      comments: hasComments && [],
      ...bodyParams,
      completedDate: moment(new Date()).format("YYYY/MM/DD"),
    });
  }
}
