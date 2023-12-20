
import Model, { ArticleCollection, BookArticleCollection, ArticleCommentCollection, ArticleUserCollection } from './collection';
import _ from 'lodash';
// 分页查询数据
export function pagination (bodyParams) {
  if (bodyParams.selector.book_id) {
    let book_id = bodyParams.selector.book_id;
    let articlesId = BookArticleCollection.find({
      book_id: book_id
    }).fetch().map(item => item.article_id)
    console.log('articlesId',articlesId)
    bodyParams.selector.book_id = '';
    let curror = ArticleCollection.find({
      ..._.pickBy(bodyParams.selector),
      _id: {
        $in: articlesId
      }
    } || {}, bodyParams.options);
    return {
      data: curror.fetch(),
      total: curror.count()
    }
  } else {
    let curror = ArticleCollection.find(_.pickBy(bodyParams.selector) || {}, bodyParams.options);
    return {
      data: curror.fetch(),
      total: curror.count()
    }
  }
}