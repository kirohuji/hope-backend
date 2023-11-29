import moment from "moment";
import Api from "../../api";
import Model, { EventCollection, EventUserCollection } from './collection'
import { BroadcastCollection, BroadcastUserCollection } from '../broadcasts/collection'
import _ from 'lodash'

Api.addCollection(EventCollection);

Api.addRoute('events/current', {
    get: {
        authRequired: true,
        action: function () {
            const events = EventUserCollection.find({
                user_id: this.user_id
            }).map(event => {
                return EventCollection.findOne({
                    _id: event.event_id
                })
            })
            const broadcasts = BroadcastUserCollection.find({
                user_id: this.user_id
            }).map(broadcast => {
                const current = BroadcastCollection.findOne({
                    _id: broadcast.broadcast_id
                })
                if(current){
                    return {
                        _id: broadcast.broadcast_id,
                        label: current?.label,
                        color: "#1890ff",
                        isBroadcast: true,
                        description: current.content.substring(0, 50),
                        allDay: true,
                        start: current.available.startDate,
                        end: current.available.endDate,
                    }
                }
            })
            return [...events, ..._.compact(broadcasts)];
        }
    },
    post: {
        authRequired: true,
        action: function () {
            const eventId = EventCollection.insert(this.bodyParams);
            return EventUserCollection.insert({
                user_id: this.userId,
                event_id: eventId
            });

        }
    }
});

Api.addRoute('events/current/:_id', {
    delete: {
        authRequired: true,
        action: function () {
            return EventCollection.remove({
                _id: this.urlParams._id
            });

        }
    },
    post: {
        authRequired: true,
        action: function () {
            return EventCollection.update({
                _id: this.urlParams._id
            }, this.bodyParams);

        }
    }
});
