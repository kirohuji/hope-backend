import Api from "../../api";
import Model, { ArticleCollection, BookArticleCollection, ArticleCommentCollection, ArticleUserCollection  } from './collection'
import _ from 'lodash'
import moment from "moment";
import Constructor from "../base/api"
Api.addCollection(ArticleCollection, {
    path: 'articles'
});
// Constructor("articles", Model)
Api.addCollection(ArticleUserCollection, {
    path: 'articles/users'
});

Api.addRoute('articles/users/current', {
    post: {
        authRequired: true,
        action: function () {
            return ArticleCollection.insert({
                author_id: this.userId,
                comments: this.bodyParams.hasComments && [],
                ...this.bodyParams
            })
        }
    }
})

Api.addRoute('articles/pagination', {
    post: function () {
        return {
            data: ArticleCollection.find( _.pickBy(this.bodyParams.selector) || {}, this.bodyParams.options).map(item => {
                return {
                    ...item,
                    // author: {
                    //     name: profile.displayName,
                    //     avatarUrl: profile.photoURL
                    // }
                };
            }),
            total: ArticleCollection.find(this.bodyParams.selector || {}, this.bodyParams.options).count()
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
        action: function() {
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

