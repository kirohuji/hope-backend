
import BroadcastCollection, { BroadcastUserCollection } from './collection'
import _ from 'lodash'

// 分页查询数据
export function pagination (bodyParams) {
  return {
    data: BroadcastCollection.find(_.pickBy(bodyParams.selector) || {}, bodyParams.options).fetch(),
    total: BroadcastCollection.find().count()
  }
}

// 统计人数
export function count (broadcast_id) {
  return BroadcastUserCollection.find({ broadcast_id }).count()
}

// 获取当前数据下所有的用户
export function users (broadcast_id) {
  return BroadcastUserCollection.find({
    broadcast_id: broadcast_id
  }).map(broadcastUser => {
    const user = ProfilesCollection.findOne({
      _id: broadcastUser.user_id
    })
    return {
      broadcast_id,
      user_id: user._id,
      status: broadcastUser.status,
      profile: user
    }
  })
}

// 签到
export function signIn ({
  broadcast_id,
  user_id
}) {
  return BroadcastUserCollection.update({
    broadcast_id,
    user_id,
  }, {
    status: 'signIn',
    broadcast_id,
    user_id,
  })
}

// 退出
export function signOut ({
  broadcast_id,
  user_id
}) {
  return BroadcastUserCollection.update({
    broadcast_id,
    user_id,
  }, {
    status: 'signOut',
    broadcast_id,
    user_id,
  })
}

// 删除用户
export function removeUser ({
  broadcast_id,
  user_id
}) {
  return BroadcastUserCollection.remove({
    broadcast_id,
    user_id
  })
}