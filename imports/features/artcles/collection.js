import { Class } from "meteor/jagi:astronomy";

export const ArtcleCollection = new Mongo.Collection('artcles');
export const ArtcleCommentCollection = new Mongo.Collection('artcles_comments');
export const ArtcleFavoriteCollection = new Mongo.Collection('artcles_favorites');
export const ArtcleFavorite = Class.create({
    name: "ArtcleFavorite",
    collection: ArtcleFavoriteCollection,
    fields: {
        artcle_id: Mongo.ObjectID,
        user_id: Mongo.ObjectID,
    }
})
export const ArtcleComment = Class.create({
    name: "ArtcleComment",
    collection: ArtcleCommentCollection,
    fields: {
        artcle_id: Mongo.ObjectID,
        user_id: Mongo.ObjectID,
        message: String,
        reply_comment_id: Mongo.ObjectID,
    }
})
export const Artcle = Class.create({
    name: "Artcle",
    collection: ArtcleCollection,
    fields: {
        scope: Mongo.ObjectID,
        author_id: Mongo.ObjectID,
        body: String,
        cover: String,
        descritpion: String,
        tags: [String],
        title: String,
        view: Number,
        share: Number,
    }
})