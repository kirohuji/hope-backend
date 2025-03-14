import { OrderCollection, OrderItemCollection } from "./collection";
import { ProfilesCollection } from "meteor/socialize:user-profile";
import _ from "lodash";
import moment from "moment";
import { MembershipTypeCollection } from "../memberships/collection";

// 分页查询数据
export function pagination(bodyParams) {
  let curror = OrderCollection.find(
    _.pickBy(bodyParams.selector) || {},
    bodyParams.options
  );
  const data = curror.fetch();
  const createdByIds = _.map(data, "userId");
  const users = ProfilesCollection.find({ _id: { $in: createdByIds } }).fetch();
  const userMap = _.keyBy(users, "_id");
  const enhancedData = data.map((item) => {
    const user = userMap[item.userId];
    let membership = {};
    const orderItems = OrderItemCollection.find({
      orderId: item._id,
    }).map((orderItem) => {
      if (orderItem.objectType === "memberships_types") {
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
  }).map((orderItem) => {
    if (orderItem.objectType === "memberships_types") {
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
