import moment from "moment";
import Api from "../../api";
import Model, { BookCollection, BookPostCollection, BookPostQuestionCollection, BookPost, BookUserCollection } from './collection'
import _ from 'lodash'
import { unified } from 'unified'
import parse from "rehype-parse";
import slug from "rehype-slug";
import toc from "@jsdevtools/rehype-toc";
import stringify from "rehype-stringify";

const processor = unified()
    .use(parse)
    .use(slug)
    .use(toc, {
        nav: false
    })
    .use(stringify);

// Api.addCollection(DictionaryCollection, roleRequired('dictionaries', '字典(Dictionaries)'));
Api.addCollection(BookCollection);
Api.addCollection(BookPostCollection, {
    path: 'books/posts'
});
Api.addCollection(BookUserCollection, {
    path: 'books/users'
});
Api.addRoute('books/model', {
    get: function () {
        console.log()
        return {
            fields: Model.schema.fields,
            fieldsNames: Model.schema.fieldsNames
        }
    }
});
Api.addRoute('books/findOne', {
    post: function () {
        return BookCollection.findOne(this.bodyParams.selector || {}, this.bodyParams.options)
    }
});
Api.addRoute('books/pagination', {
    post: function () {
        return {
            data: Model.find(this.bodyParams.selector || {}, this.bodyParams.options).fetch(),
            total: Model.find().count()
        }
    }
});
Api.addRoute('books/posts/pagination', {
    post: function () {
        return {
            data: BookPost.find(this.bodyParams.selector || {}, this.bodyParams.options).fetch(),
            total: BookPost.find(this.bodyParams.selector).count()
        }
    }
});
Api.addRoute('books/:_id/post', {
    post: {
        authRequired: true,
        action: function () {
            return BookPostCollection.insert({
                book_id: this.urlParams._id,
                ...this.bodyParams,
                author: {
                    name: this.user.username,
                    avatarUrl: this.user.profile().avatarUrl
                },
                date: this.bodyParams.date && moment(this.bodyParams.date).format('YYYY/MM//DD')
            })
        }
    }
});
Api.addRoute('books/:bookId/post/:_id', {
    patch: {
        authRequired: true,
        action: function () {
            return BookPostCollection.update(this.urlParams._id, {
                book_id: this.urlParams.bookId,
                ...this.bodyParams,
                author: {
                    name: this.user.username,
                    avatarUrl: this.user.profile().photoURL
                },
                date: this.bodyParams.date
            })
        }
    }
});

Api.addRoute('books/:_id/publish', {
    post: function () {
        BookPostCollection.find({
            book_id: this.urlParams._id,
        }).map(async post => {
            const file = await processor.process(post.content)
            const content = /<ol[^>]*>([\s\S]*)<\/ol>/
            const toc = file.value.match(content)[1]
            BookPostCollection.update(post._id, {
                $set: {
                    status: 'published',
                    toc: toc
                }
            })
            post.questions.forEach((question, index) => {
                BookPostQuestionCollection.upsert({
                    posts_id: this.urlParams._id,
                    index
                }, {
                    index,
                    ...question
                })
            })
        })
        BookCollection.update(this.urlParams._id, {
            $set: {
                _id: this.urlParams._id,
                status: 'published'
            }
        })
        return this.urlParams._id;
    }
});

Api.addRoute('books/users/current', {
    get: {
        authRequired: true,
        action: function () {
            return BookUserCollection.find({
                user_id: this.userId
            }).map(item => {
                return {
                    ...BookCollection.findOne({
                        _id: item.book_id
                    }),
                    currentStatus: item.status
                }
            })
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
                $set: { status: 'active' }
            })
        }
    }
});

Api.addRoute('books/users/current/start', {
    post: {
        authRequired: true,
        action: function () {
            return BookPostCollection.findOne({
                book_id: BookUserCollection.findOne({
                    user_id: this.userId,
                    status: 'active'
                }).book_id,
                date: this.bodyParams.date && moment(this.bodyParams.date).format('YYYY/MM//DD')
            })
        }
    },
})