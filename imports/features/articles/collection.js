import { Class } from "meteor/jagi:astronomy";

export const ArticleCollection = new Mongo.Collection('articles');
export const ArticleCommentCollection = new Mongo.Collection('articles_comments');
export const ArticleUserCollection = new Mongo.Collection('articles_users');
export const ArticleFavoriteCollection = new Mongo.Collection('articles_favorites');
export const BookArticleCollection = new Mongo.Collection('books_articles')
export const ArticleFavorite = Class.create({
    name: "ArticleFavorite",
    collection: ArticleFavoriteCollection,
    fields: {
        article_id: Mongo.ObjectID,
        user_id: Mongo.ObjectID,
    }
})
export const ArticleComment = Class.create({
    name: "ArticleComment",
    collection: ArticleCommentCollection,
    fields: {
        article_id: Mongo.ObjectID,
        user_id: Mongo.ObjectID,
        message: String,
        reply_comment_id: Mongo.ObjectID,
    }
})
export const ArticleUser = Class.create({
    name: "ArticleUser",
    collection: ArticleUserCollection,
    fields: {
        article_id: Mongo.ObjectID,
        user_id: Mongo.ObjectID,
        answers: [String],
    }
})
export default Class.create({
    name: "Article",
    collection: ArticleCollection,
    fields: {
        createdBy: {
            type: String,
            default: ''
        },
        published: {
            type: Boolean,
            default: false,
        },
        coverUrl: {
            type: String,
            default: ''
        },
        descritpion:{
            type: String,
            default: ''
        },
        tags: {
            type: [String],
            default: ''
        },
        title: {
            type: String,
            default: ''
        },
        view: {
            type: Number,
            default: ''
        },
        share:{
            type: Number,
            default: ''
        },
        date:  {
            type: String,
            default: ''
        },
        description: {
            type: String,
            default: ''
        },
        content: {
            type: String,
            default: ''
        },
        mataKeywords: {
            type: String,
            default: ''
        },
        metaDescription: {
            type: String,
            default: ''
        },
        questions: {
            type:  [Object],
            default: []
        }
    }
})

export const BookArticle = Class.create({
    name: "BookArticle",
    collection: BookArticleCollection,
    fields: {
        article_id: Mongo.ObjectID,
        book_id: Mongo.ObjectID,
    },
    behaviors: {
        timestamp: {
            hasCreatedField: true,
            createdFieldName: 'createdAt',
            hasUpdatedField: true,
            updatedFieldName: 'updatedAt'
        }
    }
});