import { EventCollection } from './collection'
import Api from "../../api";
import { serverError500 } from "../base/api";
import { current, createEvent, removeEvent, updateEvent } from './service';
import _ from 'lodash'

Api.addCollection(EventCollection);

Api.addRoute('events/current', {
  get: {
    authRequired: true,
    action: function () {
      try {
        return current(this.userId);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message
        })
      }
    }
  },
  post: {
    authRequired: true,
    action: function () {
      try {
        return createEvent({
          userId: this.userId,
          bodyParams: this.bodyParams
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message
        })
      }
    }
  }
});

Api.addRoute('events/current/:_id', {
  delete: {
    authRequired: true,
    action: function () {
      try {
        return removeEvent(this.urlParams._id);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message
        })
      }
    }
  },
  post: {
    authRequired: true,
    action: function () {
      try {
        return updateEvent({
          eventId: this.urlParams._id,
          bodyParams:  this.bodyParams
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message
        })
      }
    }
  }
});
