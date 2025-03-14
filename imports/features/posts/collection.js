import { PostsCollection, Post } from "meteor/socialize:postable";
import { LikesCollection, Like } from "meteor/socialize:likeable";
import { CommentsCollection, Comment } from "meteor/socialize:commentable";
import SimpleSchema from "simpl-schema";
Post.attachSchema({
  posterId: {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
    autoValue: null,
    index: 1,
    denyUpdate: true,
  },
  title: {
    optional: true,
    type: String,
  },
  metaTitle: {
    optional: true,
    type: String,
  },
  cover: {
    type: String,
    optional: true,
  },
  metaDescription: {
    optional: true,
    type: String,
  },
  commented: {
    optional: true,
    type: Boolean,
  },
  category: {
    optional: true,
    type: Array,
  },
  status: {
    type: String,
    allowedValues: [
      "draft",
      "pending_review",
      "published",
      "rejected",
      "archived",
      "deleted",
    ],
  },
  "category.$": {
    optional: true,
    type: String,
  },
  publishedAt: {
    type: String,
    optional: true,
  },
  scope: {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
  },
});

Like.attachSchema({
  userId: {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
    autoValue: null,
    index: 1,
    denyUpdate: true,
  },
});

Comment.attachSchema({
  userId: {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
    autoValue: null,
    index: 1,
    denyUpdate: true,
  },
});

LikesCollection._hookAspects.insert.after = [];
LikesCollection._hookAspects.remove.after = [];
LikesCollection.after.insert(function afterInsert(userId, like) {
  const collection = this.transform().getCollectionForParentLink();
  like.userId &&
    collection &&
    collection.update({ _id: like.linkedObjectId }, { $inc: { likeCount: 1 } });
});

LikesCollection.after.remove(function afterRemove(userId, like) {
  const collection = this.transform().getCollectionForParentLink();
  like.userId &&
    collection &&
    collection.update(
      { _id: like.linkedObjectId },
      { $inc: { likeCount: -1 } }
    );
});
