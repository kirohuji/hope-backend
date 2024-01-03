import Model, {
  ArticleCollection,
  BookArticleCollection,
  ArticleCommentCollection,
  ArticleUserCollection,
} from "./collection";
import _ from "lodash";
import moment from "moment";
// 分页查询数据
export function pagination(bodyParams) {
  if (bodyParams.selector.book_id) {
    let book_id = bodyParams.selector.book_id;
    let articlesId = BookArticleCollection.find({
      book_id: book_id,
    })
      .fetch()
      .map((item) => item.article_id);
    console.log("articlesId", articlesId);
    bodyParams.selector.book_id = "";
    let curror = ArticleCollection.find(
      {
        ..._.pickBy(bodyParams.selector),
        _id: {
          $in: articlesId,
        },
      } || {},
      bodyParams.options
    );
    return {
      data: curror.fetch(),
      total: curror.count(),
    };
  } else {
    let curror = ArticleCollection.find(
      _.pickBy(bodyParams.selector) || {},
      bodyParams.options
    );
    return {
      data: curror.fetch(),
      total: curror.count(),
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
