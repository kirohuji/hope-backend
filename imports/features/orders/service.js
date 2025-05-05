import { OrderCollection, OrderItemCollection } from './collection';
import { ProfilesCollection } from 'meteor/socialize:user-profile';
import _ from 'lodash';
import moment from 'moment';
import { MembershipTypeCollection, MembershipCollection } from '../memberships/collection';

// 分页查询数据
export function pagination(bodyParams) {
  let curror = OrderCollection.find(
    _.pickBy(bodyParams.selector) || {},
    bodyParams.options,
  );
  const data = curror.fetch();
  const createdByIds = _.map(data, 'userId');
  const users = ProfilesCollection.find({ _id: { $in: createdByIds } }).fetch();
  const userMap = _.keyBy(users, '_id');
  const enhancedData = data.map(item => {
    const user = userMap[item.userId];
    let membership = {};
    const orderItems = OrderItemCollection.find({
      orderId: item._id,
    }).map(orderItem => {
      if (orderItem.objectType === 'memberships_types') {
        membership = MembershipTypeCollection.findOne({
          _id: orderItem.linkedObjectId,
        });
      }
      return {
        ...orderItem,
        linkedObject: membership,
      };
    });
    return {
      ...item,
      items: orderItems,
      customer: user,
    };
  });
  return {
    data: enhancedData,
    total: OrderCollection.find(bodyParams.selector).count(),
  };
}

export function info(_id) {
  const order = OrderCollection.findOne({
    _id,
  });
  const user = ProfilesCollection.findOne({ _id: order.userId });
  let membership = {};
  const orderItems = OrderItemCollection.find({
    orderId: order._id,
  }).map(orderItem => {
    if (orderItem.objectType === 'memberships_types') {
      membership = MembershipTypeCollection.findOne({
        _id: orderItem.linkedObjectId,
      });
    }
    return {
      ...orderItem,
      linkedObject: membership,
    };
  });
  return {
    ...order,
    items: orderItems,
    customer: user,
    delivery: {},
    shippingAddress: {},
    payment: {},
    history: {
      timeline: [],
    },
  };
}

export function getUserOrders(userId) {
  const orders = OrderCollection.find({
    userId,
  }).fetch();
  
  const orderIds = orders.map(order => order._id);
  const orderItems = OrderItemCollection.find({
    orderId: { $in: orderIds },
  }).fetch();
  
  // 将订单项按 orderId 分组
  const orderItemsByOrderId = _.groupBy(orderItems, 'orderId');
  
  // 将订单项添加到对应的订单中
  return orders.map(order => ({
    ...order,
    items: orderItemsByOrderId[order._id] || []
  }));
}

// 创建新订单（包含账单功能）
export function createOrder(orderData) {
  return OrderCollection.insert(orderData);
}

// 更新订单状态
export function updateOrderStatus(orderId, status, transactionId = null) {
  const updateData = { status };
  if (transactionId) {
    updateData.transactionId = transactionId;
  }
  return OrderCollection.update(orderId, { $set: updateData });
}

// 获取用户订单历史（包含账单）
// export function getUserOrders(userId, options = {}) {
//   return OrderCollection.find(
//     { userId, removed: { $ne: true } },
//     options
//   ).fetch();
// }

// 处理会员升级支付成功
export async function handleMembershipUpgradePayment(orderId) {
  const order = OrderCollection.findOne(orderId);
  if (!order || order.status !== "completed") {
    throw new Error("Invalid order or order not completed");
  }

  // 更新会员信息
  await MembershipCollection.update(
    { _id: order.membershipId },
    {
      $set: {
        type: order.membershipType,
        status: "active",
        paymentMethod: order.paymentMethod,
        orderId: order.transactionId,
      },
    }
  );

  return true;
}
