import Api from "../../api";
import { NotificationtCollection } from './collection'
import _ from 'lodash'

Api.addCollection(NotificationtCollection);

// 发布
Meteor.publish('notifications', function () {
    return NotificationtCollection.find({
        target_id: this.userId,
        isRemove: false,
    })
});

