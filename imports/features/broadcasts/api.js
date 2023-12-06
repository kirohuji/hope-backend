import Model, { BroadcastCollection, BroadcastUserCollection } from './collection'
import { ProfilesCollection } from 'meteor/socialize:user-profile';
import _ from 'lodash'
import moment from "moment";
import Api from "../../api";
import Constructor from "../base/api"
import { serverError500 } from "../base/api";
import { pagination, count, users, signIn, signOut, removeUser } from './service';

Api.addCollection(BroadcastCollection);

Constructor("broadcasts", Model)

Api.addCollection(BroadcastUserCollection, {
  path: 'broadcasts/users'
});

Api.addRoute('broadcasts/model', {
  get: function () {
    return {
      fields: Model.schema.fields,
      fieldsNames: Model.schema.fieldsNames
    }
  }
});

// 废弃
Api.addRoute('broadcasts/book', {
  get: function () {
    return BroadcastCollection.findOne({
      modifiedDate: moment(new Date()).format('YYYY/MM/DD')
    })
  }
});

Api.addRoute('broadcasts/pagination', {
  post: function () {
    try {
      console.log('this.bodyParams',this.bodyParams)
      return pagination(this.bodyParams);
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message
      })
    }
  }
});

Api.addRoute('broadcasts/:_id/users', {
  get: function () {
    try {
      return users(this.urlParams._id);
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message
      })
    }
  }
});

Api.addRoute('broadcasts/:_id/users/count', {
  get: function () {
    try {
      return count(this.urlParams._id);
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message
      })
    }
  }
});


Api.addRoute('broadcasts/:_id/users/:_userId/signIn', {
  post: function () {
    try {
      return signIn({
        broadcast_id: this.urlParams._id,
        user_id: this.urlParams._userId
      });
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message
      })
    }
  }
});

Api.addRoute('broadcasts/:_id/users/:_userId/signOut', {
  post: function () {
    try {
      return signOut({
        broadcast_id: this.urlParams._id,
        user_id: this.urlParams._userId
      });
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message
      })
    }
  }
});

Api.addRoute('broadcasts/:_id/users/:_userId', {
  delete: function () {
    try {
      return removeUser({
        broadcast_id: this.urlParams._id,
        user_id: this.urlParams._userId
      });
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message
      })
    }                                                                          
  }
});