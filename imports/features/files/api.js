import moment from "moment";
import Api from "../../api";
import Model, { FileCollection, FileUserCollection, FolderCollection } from './collection'
import _ from 'lodash'
import { ProfilesCollection } from 'meteor/socialize:user-profile';
Api.addCollection(FileCollection);

// Api.addCollection(FolderCollection);

Api.addRoute('files/current', {
    get: {
        authRequired: true,
        action: function () {
            let fileUsers = FileUserCollection.find({
                user_id: this.userId,
            }).fetch();
            return fileUsers.map(item => {
                let file = Model.findOne({ _id: item.file_id })
                let users = FileUserCollection.find({
                    file_id: file._id,
                }).fetch()
                let shared = ProfilesCollection.find({
                    _id: {
                        $in: users.map(user => user.user_id)
                    }
                }).fetch()
                file.shared = shared;
                // file.isMain = item
                return file;
            })
        }
    },
    post: {
        authRequired: true,
        action: function () {
            let _id = FileCollection.insert({
                ...this.bodyParams,
            });
            return FileUserCollection.insert({
                file_id: _id,
                user_id: this.userId,
                isMain: true
            })
        }
    }
});

Api.addRoute('files/current/:_id', {
    delete: {
        authRequired: true,
        action: function () {
            FileCollection.remove({
                _id: this.urlParams._id
            });
            return FileUserCollection.remove({
                file_id: this.urlParams._id
            });

        }
    },
    post: {
        authRequired: true,
        action: function () {
            return FileCollection.update({
                _id: this.urlParams._id
            }, this.bodyParams);

        }
    }
});

Api.addRoute('files/current/accpetShareFile', {
    post: {
        authRequired: true,
        action: function () {
            const user = ProfilesCollection.findOne({
                _id: this.userId
            })
            Meteor.notifications.insert({
                file_id: this.bodyParams.file_id,
                type: 'chat',
                title: `<p><strong>${user.displayName}</strong> 接受了你的文件共享 <strong><a href='#'>文件管理</a></strong></p>`,
                isUnRead: true,
                publisher_id: this.userId,
                target_id: this.bodyParams.publisher_id,
                createdAt: new Date(),
                category: "File",
            });
            Meteor.notifications.update({
                _id: this.bodyParams._id
            }, {
                $set: {
                    isRemove: true,
                }
            })
            return FileUserCollection.insert({
                file_id: this.bodyParams.file_id,
                user_id: this.userId,
                isMain: false
            })

        }
    }
});

Api.addRoute('files/current/denyShareFile', {
    post: {
        authRequired: true,
        action: function () {
            const user = ProfilesCollection.findOne({
                _id: this.userId
            })
            return Meteor.notifications.insert({
                file_id: this.bodyParams.file_id,
                type: 'chat',
                title: `<p><strong>${user.displayName}</strong> 拒绝接受你的文件共享 <strong><a href='#'>文件管理</a></strong></p>`,
                isUnRead: true,
                publisher_id: this.bodyParams.target_id,
                target_id: this.bodyParams.publisher_id,
                createdAt: new Date(),
                category: "File",
            });
        }
    }
});

Api.addRoute('files/current/inviteEmail', {
    post: {
        authRequired: true,
        action: function () {
            const user = ProfilesCollection.findOne({
                username: this.bodyParams.inviteEmail
            })
            return Meteor.notifications.insert({
                file_id: this.bodyParams.fileId,
                type: 'share',
                title: `<p><strong>${user.displayName}</strong> 共享一个文件 <strong><a href='#'>文件管理</a></strong></p>`,
                isUnRead: true,
                publisher_id: this.userId,
                target_id: user._id,
                createdAt: new Date(),
                category: "File",
            });
        }
    }
})

Api.addRoute('files/current/type/mp3', {
    get: {
        authRequired: true,
        action: function () {
            let fileUsers = FileUserCollection.find({
                user_id: this.userId,
            }).fetch();
            return _.compact(fileUsers.map(item => Model.findOne({ _id: item.file_id, type: 'mp3' })))
        }
    },
});
