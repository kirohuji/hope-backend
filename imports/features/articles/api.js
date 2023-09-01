import Api from "../../api";
import Model, { ArticleCollection, BookArticleCollection, ArticleCommentCollection } from './collection'
import _ from 'lodash'
Api.addCollection(ArticleCollection,{
    path: 'articles'
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
            data: ArticleCollection.find(this.bodyParams.selector || {}, this.bodyParams.options).map(item => {
                // const profile = Meteor.users.findOne({ _id: item.author_id }).profile()
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