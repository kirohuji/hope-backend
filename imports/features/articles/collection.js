import { Class } from "meteor/jagi:astronomy";

export const ArticleCollection = new Mongo.Collection("articles");
export const ArticleCommentCollection = new Mongo.Collection(
  "articles_comments"
);
export const ArticleUserCollection = new Mongo.Collection("articles_users");
export const ArticleFavoriteCollection = new Mongo.Collection(
  "articles_favorites"
);
export const BookArticleCollection = new Mongo.Collection("books_articles");
export const ArticleFavorite = Class.create({
  name: "ArticleFavorite",
  collection: ArticleFavoriteCollection,
  fields: {
    article_id: Mongo.ObjectID,
    user_id: Mongo.ObjectID,
  },
});
export const ArticleComment = Class.create({
  name: "ArticleComment",
  collection: ArticleCommentCollection,
  fields: {
    article_id: Mongo.ObjectID,
    user_id: Mongo.ObjectID,
    message: String,
    reply_comment_id: Mongo.ObjectID,
  },
});
export const ArticleUser = Class.create({
  name: "ArticleUser",
  collection: ArticleUserCollection,
  fields: {
    article_id: Mongo.ObjectID,
    user_id: Mongo.ObjectID,
    answers: [String],
    completedDate: String,
  },
});
export default Class.create({
  name: "Article",
  collection: ArticleCollection,
  fields: {
    createdBy: {
      type: String,
      default: "",
      optional: true,
    },
    published: {
      type: Boolean,
      default: true,
      optional: true,
    },
    coverUrl: {
      type: String,
      optional: true,
      default: "",
    },
    descritpion: {
      type: String,
      default: "",
      optional: true,
    },
    tags: {
      type: [String],
      default: "",
      optional: true,
    },
    title: {
      type: String,
      default: "",
      optional: true,
    },
    view: {
      type: Number,
      default: "",
      optional: true,
    },
    share: {
      type: Number,
      default: "",
      optional: true,
    },
    date: {
      type: String,
      default: "",
      optional: true,
    },
    description: {
      type: String,
      default: "",
      optional: true,
    },
    content: {
      type: String,
      default: "",
      optional: true,
    },
    mataKeywords: {
      type: String,
      default: "",
      optional: true,
    },
    metaDescription: {
      type: String,
      default: "",
      optional: true,
    },
    questions: {
      type: [Object],
      default: [],
      optional: true,
    },
  },
});

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
      createdFieldName: "createdAt",
      hasUpdatedField: true,
      updatedFieldName: "updatedAt",
    },
  },
});
