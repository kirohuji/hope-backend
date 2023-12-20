import { EventCollection, EventUserCollection } from './collection'
import { BroadcastCollection, BroadcastUserCollection } from '../broadcasts/collection'
import _ from 'lodash'

// 当前用户所有的事件
export function current (user_id) {
  const events = EventUserCollection.find({
    user_id: user_id
  }).map(event => {
    return EventCollection.findOne({
      _id: event.event_id
    })
  })
  const broadcasts = BroadcastUserCollection.find({
    user_id: user_id
  }).map(broadcast => {
    const current = BroadcastCollection.findOne({
      _id: broadcast.broadcast_id,
      published: true,
    })
    if (current) {
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

// 创建一个新的事件
export function createEvent ({
  bodyParams,
  userId
}) {
  const eventId = EventCollection.insert(bodyParams);
  return EventUserCollection.insert({
    user_id: userId,
    event_id: eventId
  });
}

// 删除一个的事件
export function removeEvent (eventId) {
  return EventCollection.remove({
    _id: eventId
  });
}

// 更新一个的事件
export function updateEvent ({
  eventId,
  bodyParams
}) {
  return EventCollection.update({
    _id: eventId
  }, bodyParams);
}

