import moment from "moment";
import Api from "../../api";
import Model, { BookCollection, BookPostCollection, BookPostQuestionCollection, BookPost, BookUserCollection } from './collection'
import { BookArticleCollection, ArticleCollection, ArticleUserCollection } from '../articles/collection'
import _ from 'lodash'
import { unified } from 'unified'
import parse from "rehype-parse";
import slug from "rehype-slug";
import toc from "@jsdevtools/rehype-toc";
import stringify from "rehype-stringify";
import Constructor from "../base/api"

const processor = unified()
    .use(parse)
    .use(slug)
    .use(toc, {
        nav: false
    })
    .use(stringify);

// Api.addCollection(DictionaryCollection, roleRequired('dictionaries', '字典(Dictionaries)'));
Api.addCollection(BookCollection);
Constructor("books", Model)
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

// Api.addRoute('books/users/current/start', {
//     post: {
//         authRequired: true,
//         action: function () {
//             let bookUser = BookUserCollection.findOne({
//                 user_id: this.userId,
//                 status: 'active'
//             })
//             return BookPostCollection.findOne({
//                 book_id: bookUser.book_id,
//                 date: this.bodyParams.date && moment(this.bodyParams.date).format('YYYY/MM//DD')
//             })
//         }
//     },
// })

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
            try{
                let bookUser = BookUserCollection.findOne({
                    user_id: this.userId,
                    status: 'active'
                })
                let book = BookCollection.findOne({
                    _id: bookUser.book_id
                },{
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
            } catch(e){
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
            }).map(item=> {
                return ArticleCollection.findOne({
                    _id: item.article_id
                })
            })
        }
    },
})