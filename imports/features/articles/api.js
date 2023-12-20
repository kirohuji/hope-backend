import Api from "../../api";
import Model, { ArticleCollection, BookArticleCollection, ArticleCommentCollection, ArticleUserCollection } from './collection'
import _ from 'lodash'
import moment from "moment";
import Constructor from "../base/api"
import { serverError500 } from "../base/api";
import { pagination } from './service';

Api.addCollection(ArticleCollection, {
  path: 'articles'
});
Api.addCollection(ArticleUserCollection, {
  path: 'articles/users'
});

Constructor("articles", Model)

Api.addRoute('articles/pagination', {
  post: function () {
    try {
      return pagination(this.bodyParams);
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message
      })
    }
  }
})

Api.addRoute('books/:_id/article', {
  post: {
    authRequired: true,
    action: function () {
      return BookArticleCollection.insert({
        book_id: this.urlParams._id,
        ...this.bodyParams,
        author: {
          name: this.user.username,
          avatarUrl: this.user.profile().photoURL
        },
        date: this.bodyParams.date && moment(this.bodyParams.date).format('YYYY/MM//DD')
      })
    }
  }
});

Api.addRoute('books/:_id/article/update', {
  post: {
    authRequired: true,
    action: function () {
      return BookArticleCollection.update({
        book_id: this.urlParams._id,
        article_id: this.bodyParams.article_id
      }, {
        ...this.bodyParams,
        author: {
          name: this.user.username,
          avatarUrl: this.user.profile().photoURL
        },
        date: this.bodyParams.date && moment(this.bodyParams.date).format('YYYY/MM//DD')
      })
    }
  }
});

Api.addRoute('articles/content/:_id', {
  get: function () {
    const artcle = ArticleCollection.findOne({
      _id: this.urlParams._id
    })
    const profile = Meteor.users.findOne({ _id: artcle.author_id }).profile();

    return {
      ...artcle,
      comments: ArticleCommentCollection.find({
        artcle_id: this.urlParams._id,
      }).fetch(),
      author: {
        name: profile.displayName,
        avatarUrl: profile.photoURL
      }
    }
  }
})
Api.addRoute('articles/comments/users/current', {
  post: {
    authRequired: true,
    action: function () {
      return ArticleCommentCollection.insert({
        user_id: this.userId,
        ...this.bodyParams
      })
    }
  }
})

Api.addRoute('articles/users/current/:_id', {
  get: {
    authRequired: true,
    action: function () {
      const artcleUser = ArticleUserCollection.findOne({
        article_id: this.urlParams._id,
        user_id: this.userId
      })
      return artcleUser || {
        article_id: this.urlParams._id,
        user_id: this.userId,
        answers: []
      }
    },
  }
})

// Api.addRoute('articles/users/current', {
//     post: {
//         authRequired: true,
//         action: function () {
//             console.log(this.bodyParams)
//             if(this.bodyParams._id){
//                 return ArticleUserCollection.upsert({
//                     _id: this.bodyParams._id,
//                 },{
//                     article_id: this.bodyParams.article_id,
//                     user_id: this.userId,
//                     answers: this.bodyParams.answers,
//                 })
//             } else {
//                 return ArticleUserCollection.insert({
//                     article_id: this.bodyParams.article_id,
//                     user_id: this.userId,
//                     answers: this.bodyParams.answers,
//                     comments: this.bodyParams.hasComments && [],
//                     ...this.bodyParams
//                 })
//             }
//         }
//     }
// })
