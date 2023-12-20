import moment from "moment";
import Api from "../../api";
import Model, { BookCollection, BookPostCollection, BookPostQuestionCollection, BookPost, BookUserCollection } from './collection'
import { BookArticleCollection, ArticleCollection, ArticleUserCollection } from '../articles/collection'
import _ from 'lodash'
import Constructor from "../base/api"
import { serverError500 } from "../base/api";
import { findOne, pagination, publish, unPublish } from './service'
Api.addCollection(BookPostCollection, {
  path: 'books/posts'
});

Api.addCollection(BookUserCollection, {
  path: 'books/users'
});

Api.addCollection(BookCollection);

Constructor("books", Model)

Api.addRoute('books/pagination', {
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
});

Api.addRoute('books/:bookId/dates', {
  post: {
    authRequired: true,
    action: function () {
      return BookArticleCollection.find({
        book_id: this.urlParams.bookId,
      }).map(item => moment(item.date).format('YYYY/MM//DD'))
    }
  },
})

Api.addRoute('books/users/current/start', {
  post: {
    authRequired: true,
    action: function () {
      let bookUser = BookUserCollection.findOne({
        user_id: this.userId,
        status: 'active'
      })
      let article = BookArticleCollection.findOne({
        book_id: bookUser?.book_id,
        date: this.bodyParams.date && moment(this.bodyParams.date).format('YYYY/MM//DD')
      })
      return article || false;
    }
  },
})

Api.addRoute('books/users/current/signIn/:_id', {
  post: {
    authRequired: true,
    action: function () {
      let articleUser = ArticleUserCollection.findOne({
        article_id: this.urlParams._id,
        user_id: this.userId,
      })
      let signIn = ArticleUserCollection.update({
        article_id: this.urlParams._id,
        user_id: this.userId,
      }, {
        ...articleUser,
        signIn: true
      })
      if (signIn) {
        console.log('成功')
        Meteor.notifications.insert({
          type: 'training',
          title: '<p>签到成功</p>',
          isUnRead: true,
          publisher_id: this.userId,
          createdAt: new Date(),
          category: "Training",
        });
        return true
      }
    }
  },
})


Api.addRoute('books/users/current', {
  get: {
    authRequired: true,
    action: function () {
      let bookUser = BookUserCollection.find({
        user_id: this.userId,
      })
      if (bookUser) {
        return bookUser.map(item => {
          console.log('bookUser', item)
          return {
            ...BookCollection.findOne({
              _id: item.book_id
            }),
            currentStatus: item.status
          }
        })
      } else {
        return []
      }
    }
  },
  post: {
    authRequired: true,
    action: function () {
      return BookUserCollection.upsert({
        user_id: this.userId,
        book_id: this.bodyParams.book_id,
      }, {
        user_id: this.userId,
        book_id: this.bodyParams.book_id,
      })
    }
  },
  patch: {
    authRequired: true,
    action: function () {
      BookUserCollection.update({
        user_id: this.userId,
      }, {
        $set: { status: 'none' }
      }, {
        multi: true
      })
      return BookUserCollection.update({
        user_id: this.userId,
        book_id: this.bodyParams.book_id,
      }, {
        $set: { status: this.bodyParams.status }
      })
    }
  }
});

Api.addRoute('books/users/current/:bookId', {
  delete: {
    authRequired: true,
    action: function () {
      return BookUserCollection.remove({
        user_id: this.userId,
        book_id: this.urlParams.book_id,
      })
    }
  },
  get: {
    authRequired: true,
    action: function () {
      let bookUser = BookUserCollection.find({
        user_id: this.userId,
        book_id: this.urlParams.bookId,
      })
      if (bookUser) {
        return bookUser.map(item => {
          return {
            ...BookCollection.findOne({
              _id: item.book_id
            }),
            currentStatus: item.status
          }
        })
      } else {
        return []
      }
    }
  }
})

Api.addRoute('books/users/current/:bookId/summarize', {
  get: {
    authRequired: true,
    action: function () {
      let bookUser = BookUserCollection.findOne({
        user_id: this.userId,
        book_id: this.urlParams.bookId,
      })
      if (bookUser) {
        const total = BookArticleCollection.find({
          book_id: this.urlParams.bookId,
        })

        let selector = {
          article_id: { $in: total.map(i => i.article_id) },
          user_id: this.userId,
          $where: 'this.answers.length>0'
        }
        return {
          total: total.count(),
          inProcess: ArticleUserCollection.find(selector).count()
        }
      } else {
        return {
          total: 0,
          inProcess: 0
        }
      }
    }
  }
})


Api.addRoute('books/users/current/play', {
  get: {
    authRequired: true,
    action: function () {
      try {
        let bookUser = BookUserCollection.findOne({
          user_id: this.userId,
          status: 'active'
        })
        let book = BookCollection.findOne({
          _id: bookUser.book_id
        }, {
          fields: {
            label: 1,
            cover: 1,
          }
        });
        let bookArticle = BookArticleCollection.findOne({
          book_id: bookUser?.book_id,
          date: this.bodyParams.date && moment(this.bodyParams.date).format('YYYY/MM//DD')
        })
        const article = ArticleCollection.findOne({
          _id: bookArticle.article_id
        }, {
          fields: {
            title: 1,
            description: 1,
            date: 1
          }
        })
        const articleList = BookArticleCollection.find({
          book_id: bookUser?.book_id,
        }).map(i => ArticleCollection.findOne({
          _id: i.article_id
        }, {
          fields: {
            title: 1,
            description: 1,
            date: 1
          }
        }))
        return {
          book,
          article,
          list: articleList
        }
      } catch (e) {
        return {
          book: null,
          article: null,
          list: []
        }
      }
    }
  },
})

Api.addRoute('books/articles/pagination', {
  post: {
    authRequired: true,
    action: function () {
      return BookArticleCollection.find({
        book_id: this.bodyParams.book_id
      }).map(item => {
        return ArticleCollection.findOne({
          _id: item.article_id
        })
      })
    }
  },
})

Api.addRoute('books/:bookId/publish', {
  post: function () {
    try {
      console.log('this.urlParams._id',this.urlParams)
      return publish(this.urlParams.bookId);
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message
      })
    }                                                                          
  }
});

Api.addRoute('books/:bookId/unpublish', {
  post: function () {
    try {
      return unPublish(this.urlParams.bookId);
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message
      })
    }                                                                          
  }
});