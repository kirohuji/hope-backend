import moment from "moment";
import Api from "../../api";
import Model, { BroadcastCollection, BroadcastUserCollection } from './collection'
import { ProfilesCollection } from 'meteor/socialize:user-profile';
import _ from 'lodash'
import Constructor from "../base/api"

Api.addCollection(BroadcastCollection);
Constructor("broadcasts", Model)
Api.addCollection(BroadcastUserCollection, {
    path: 'broadcasts/users'
});
Api.addRoute('broadcasts/model', {
    get: function () {
        console.log()
        return {
            fields: Model.schema.fields,
            fieldsNames: Model.schema.fieldsNames
        }
    }
});
Api.addRoute('broadcasts/book', {
    get: function () {
        return BroadcastCollection.findOne({
            modifiedDate: moment(new Date()).format('YYYY/MM/DD')
        })
    }
});

Api.addRoute('broadcasts/pagination', {
    post: function () {
        return {
            data: Model.find(_.pickBy(this.bodyParams.selector) || {}, this.bodyParams.options).fetch(),
            total: Model.find().count()
        }
    }
});

Api.addRoute('broadcasts/:_id/users', {
    get: function () {
        return BroadcastUserCollection.find({
            broadcast_id: this.urlParams._id
        }).map(broadcastUser => {
            const user = Meteor.users.findOne({
                _id: broadcastUser.user_id
            })
            return {
                ...user,
                broadcast_id: this.urlParams._id,
                user_id: user._id,
                status: broadcastUser.status,
                profile: ProfilesCollection.findOne({
                    _id: broadcastUser.user_id
                })
            }
        })
    }
});
Api.addRoute('broadcasts/:_id/users/count', {
    get: function () {
        return BroadcastUserCollection.find({
            broadcast_id: this.urlParams._id
        }).count()
    }
});


Api.addRoute('broadcasts/:_id/users/:_userId/signIn', {
    post: function () {
        return BroadcastUserCollection.update({
            broadcast_id: this.urlParams._id,
            user_id: this.urlParams._userId
        }, {
            status: 'signIn',
            broadcast_id: this.urlParams._id,
            user_id: this.urlParams._userId
        })
    }
});

Api.addRoute('broadcasts/:_id/users/:_userId/signOut', {
    post: function () {
        return BroadcastUserCollection.update({
            broadcast_id: this.urlParams._id,
            user_id: this.urlParams._userId
        }, {
            status: 'signOut',
            broadcast_id: this.urlParams._id,
            user_id: this.urlParams._userId
        })
    }
});

Api.addRoute('broadcasts/:_id/users/:_userId', {
    delete: function () {
        return BroadcastUserCollection.remove({
            broadcast_id: this.urlParams._id,
            user_id: this.urlParams._userId
        })
    }
});

Api.addRoute('broadcasts/publish', {
    get: function () {

    }
});
