import { Class } from "meteor/jagi:astronomy";
export const BookCollection = new Mongo.Collection('books')
export const BookPostCollection = new Mongo.Collection('books_posts')
export const BookPostQuestionCollection = new Mongo.Collection('books_posts_questions')
export const BookPostQuestionAnswerCollection = new Mongo.Collection('books_posts_questions_answers')
export const BookUserCollection = new Mongo.Collection('books_users')
export const BookPostUserCollection = new Mongo.Collection('books_posts_users')

export const BookUser = Class.create({
    name: "BookUser",
    collection: BookUserCollection,
    fields: {
        user_id: Mongo.ObjectID,
        book_id: Mongo.ObjectID,
        status: String
    },
});

export const BookPost = Class.create({
    name: "BookPost",
    collection: BookPostCollection,
    fields: {
        content: String,
        title: String,
        date: Date,
        book_id: Mongo.ObjectID,
        questions: [Object],
        author: Object,
        favoritePerson: [Object],
        tags: [String],
        favorite: Number,
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
export const BookPostsQuestion = Class.create({
    name: "BookPostQuestion",
    collection: BookPostQuestionCollection,
    fields: {
        value: String,
        index: String,
        posts_id: Mongo.ObjectID,
    },
});
export const BookPostQuestionAnswer = Class.create({
    name: "BookPostQuestionAnswer",
    collection: BookPostQuestionAnswerCollection,
    fields: {
        value: String,
        user_id: Mongo.ObjectID,
        question_id: Mongo.ObjectID,
    },
});

export default Class.create({
    name: "Book",
    collection: BookCollection,
    fields: {
        value: {
            type: String,
            default: '',
        },
        label: {
            type: String,
            default: '',
            label: '名称',
        },
        description: {
            type: String,
            default: '',
        },
        status: {
            type: String,
            default: '',
        },
        type: {
            type: String,
            default: '',
        },
    }
});
