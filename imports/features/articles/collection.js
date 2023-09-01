import { Class } from "meteor/jagi:astronomy";

export const ArticleCollection = new Mongo.Collection('articles');
export const ArticleCommentCollection = new Mongo.Collection('articles_comments');
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
export default Class.create({
    name: "Article",
    collection: ArticleCollection,
    fields: {
        scope: Mongo.ObjectID,
        author_id: Mongo.ObjectID,
        public: String,
        createdAt: String,
        body: String,
        coverUrl: String,
        descritpion: String,
        tags: [String],
        title: String,
        view: Number,
        share: Number,
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