import { MembershipCollection, MembershipTypeCollection } from "./collection";
import { OrderCollection, OrderItemCollection, OrderHistoryCollection } from "../orders/collection";
import { ProfilesCollection } from "meteor/socialize:user-profile";
import _ from "lodash";
import moment from "moment";

// 分页查询数据
export function pagination(bodyParams) {
  let cursor = MembershipCollection.find(
    _.pickBy(bodyParams.selector) || {},
    bodyParams.options
  );
  const data = cursor.fetch();
  const userIds = _.map(data, "userId");
  const users = ProfilesCollection.find({ _id: { $in: userIds } }).fetch();
  const userMap = _.keyBy(users, "_id");
  
  // 获取会员类型信息
  const membershipTypeIds = _.map(data, "membershipTypeId");
  const membershipTypes = MembershipTypeCollection.find({
    _id: { $in: membershipTypeIds }
  }).fetch();
  const membershipTypeMap = _.keyBy(membershipTypes, "_id");
  
  const enhancedData = data.map((item) => {
    const user = userMap[item.userId];
    const membershipType = membershipTypeMap[item.membershipTypeId];
    return {
      ...item,
      user: user ? {
        name: user.realName || user.displayName,
        email: user.email
      } : null,
      membershipType: membershipType ? {
        name: membershipType.name,
        identifier: membershipType.identifier
      } : null,
      // 格式化日期显示
      currentPeriodStart: moment(item.currentPeriodStart).format('YYYY-MM-DD'),
      currentPeriodEnd: moment(item.currentPeriodEnd).format('YYYY-MM-DD'),
      nextRenewalDate: item.nextRenewalDate ? moment(item.nextRenewalDate).format('YYYY-MM-DD') : null,
    };
  });
  
  return {
    data: enhancedData,
    total: cursor.count(),
  };
}

// 创建订阅 - 首次订阅立即生效
export async function createSubscription(userId, membershipTypeId, billingCycle, paymentMethod) {
  // 检查用户是否已有活跃订阅
  const existingMembership = MembershipCollection.findOne({
    userId,
    status: { $in: ["active", "past_due"] }
  });
  
  if (existingMembership) {
    throw new Error("用户已有活跃订阅");
  }
  
  // 获取会员类型信息
  const membershipType = MembershipTypeCollection.findOne({ _id: membershipTypeId });
  if (!membershipType) {
    throw new Error("会员类型不存在");
  }
  
  // 计算价格
  const price = billingCycle === "yearly" ? membershipType.yearlyPrice : membershipType.monthlyPrice;
  
  // 计算周期时间
  const now = new Date();
  const periodEnd = billingCycle === "yearly" 
    ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
    : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  
  // 创建订单
  const orderNumber = generateOrderNumber("SUB");
  const orderId = OrderCollection.insert({
    userId,
    orderNumber,
    type: "subscription",
    status: "pending",
    membershipTypeId,
    billingCycle,
    subtotal: price,
    totalAmount: price,
    currency: membershipType.currency || "CNY",
    paymentMethod,
    effectiveDate: now
  });
  
  // 创建订单项
  OrderItemCollection.insert({
    orderId,
    membershipTypeId,
    billingCycle,
    unitPrice: price,
    quantity: 1,
    periodStart: now,
    periodEnd
  });
  
  // 记录订单历史
  OrderHistoryCollection.insert({
    orderId,
    action: "created",
    status: "pending",
    description: "创建订阅订单",
    operatorId: userId
  });
  
  return {
    orderId,
    orderNumber,
    price,
    billingCycle,
    effectiveDate: now,
    periodEnd
  };
}

// 完成支付并激活订阅
export async function completeSubscriptionPayment(orderId, transactionId) {
  const order = OrderCollection.findOne({ _id: orderId });
  if (!order || order.status !== "pending") {
    throw new Error("订单状态无效");
  }
  
  const now = new Date();
  
  // 更新订单状态
  OrderCollection.update(orderId, {
    $set: {
      status: "completed",
      transactionId,
      paidAt: now,
      updatedAt: now
    }
  });
  
  // 获取订单项信息
  const orderItem = OrderItemCollection.findOne({ orderId });
  
  // 创建会员记录
  const membershipId = MembershipCollection.insert({
    userId: order.userId,
    membershipTypeId: order.membershipTypeId,
    status: "active",
    currentPeriodStart: orderItem.periodStart,
    currentPeriodEnd: orderItem.periodEnd,
    autoRenew: true,
    nextRenewalDate: orderItem.periodEnd,
    billingCycle: order.billingCycle,
    currentPrice: order.totalAmount,
    currency: order.currency,
    paymentMethod: order.paymentMethod,
    lastPaymentDate: now
  });
  
  // 更新订单关联的会员ID
  OrderCollection.update(orderId, {
    $set: { membershipId }
  });
  
  // 记录历史
  OrderHistoryCollection.insert({
    orderId,
    action: "completed",
    status: "completed",
    description: "订阅支付完成，会员已激活",
    operatorId: order.userId
  });
  
  return { membershipId, status: "active" };
}

// 自动续订 - 周期结束后无缝续订
export async function processAutoRenewal(membershipId) {
  const membership = MembershipCollection.findOne({ _id: membershipId });
  if (!membership || !membership.autoRenew || membership.status !== "active") {
    return false;
  }
  
  // 检查是否到了续订时间
  const now = new Date();
  if (now < membership.nextRenewalDate) {
    return false;
  }
  
  // 获取会员类型
  const membershipType = MembershipTypeCollection.findOne({ 
    _id: membership.membershipTypeId 
  });
  
  if (!membershipType) {
    throw new Error("会员类型不存在");
  }
  
  // 计算新的周期
  const newPeriodStart = membership.currentPeriodEnd;
  const newPeriodEnd = membership.billingCycle === "yearly"
    ? new Date(newPeriodStart.getFullYear() + 1, newPeriodStart.getMonth(), newPeriodStart.getDate())
    : new Date(newPeriodStart.getFullYear(), newPeriodStart.getMonth() + 1, newPeriodStart.getDate());
  
  const price = membership.billingCycle === "yearly" 
    ? membershipType.yearlyPrice 
    : membershipType.monthlyPrice;
  
  // 创建续订订单
  const orderNumber = generateOrderNumber("REN");
  const orderId = OrderCollection.insert({
    userId: membership.userId,
    orderNumber,
    type: "renewal",
    status: "completed", // 自动续订直接完成
    membershipId,
    membershipTypeId: membership.membershipTypeId,
    billingCycle: membership.billingCycle,
    subtotal: price,
    totalAmount: price,
    currency: membership.currency,
    paymentMethod: membership.paymentMethod,
    effectiveDate: newPeriodStart,
    paidAt: now
  });
  
  // 创建订单项
  OrderItemCollection.insert({
    orderId,
    membershipTypeId: membership.membershipTypeId,
    billingCycle: membership.billingCycle,
    unitPrice: price,
    quantity: 1,
    periodStart: newPeriodStart,
    periodEnd: newPeriodEnd
  });
  
  // 更新会员记录
  MembershipCollection.update(membershipId, {
    $set: {
      currentPeriodStart: newPeriodStart,
      currentPeriodEnd: newPeriodEnd,
      nextRenewalDate: newPeriodEnd,
      currentPrice: price,
      lastPaymentDate: now,
      updatedAt: now
    }
  });
  
  // 记录历史
  OrderHistoryCollection.insert({
    orderId,
    action: "completed",
    status: "completed",
    description: "自动续订成功",
    operatorId: membership.userId
  });
  
  return true;
}

// 升级订阅 - 立即生效（按比例计费）
export async function upgradeSubscription(membershipId, newMembershipTypeId) {
  const membership = MembershipCollection.findOne({ _id: membershipId });
  if (!membership || membership.status !== "active") {
    throw new Error("会员记录无效");
  }
  
  const currentType = MembershipTypeCollection.findOne({ _id: membership.membershipTypeId });
  const newType = MembershipTypeCollection.findOne({ _id: newMembershipTypeId });
  
  if (!currentType || !newType) {
    throw new Error("会员类型不存在");
  }
  
  // 计算按比例计费
  const now = new Date();
  const totalDays = Math.ceil((membership.currentPeriodEnd - membership.currentPeriodStart) / (1000 * 60 * 60 * 24));
  const remainingDays = Math.ceil((membership.currentPeriodEnd - now) / (1000 * 60 * 60 * 24));
  
  const currentPrice = membership.billingCycle === "yearly" ? currentType.yearlyPrice : currentType.monthlyPrice;
  const newPrice = membership.billingCycle === "yearly" ? newType.yearlyPrice : newType.monthlyPrice;
  
  // 计算退款和新费用
  const refundAmount = (currentPrice / totalDays) * remainingDays;
  const newChargeAmount = (newPrice / totalDays) * remainingDays;
  const prorationAmount = newChargeAmount - refundAmount;
  
  // 创建升级订单
  const orderNumber = generateOrderNumber("UPG");
  const orderId = OrderCollection.insert({
    userId: membership.userId,
    orderNumber,
    type: "upgrade",
    status: "completed",
    membershipId,
    membershipTypeId: newMembershipTypeId,
    billingCycle: membership.billingCycle,
    subtotal: newChargeAmount,
    prorationAmount,
    discountAmount: refundAmount,
    totalAmount: prorationAmount,
    currency: membership.currency,
    paymentMethod: membership.paymentMethod,
    effectiveDate: now,
    paidAt: now
  });
  
  // 创建订单项
  OrderItemCollection.insert({
    orderId,
    membershipTypeId: newMembershipTypeId,
    billingCycle: membership.billingCycle,
    unitPrice: newPrice,
    quantity: 1,
    periodStart: now,
    periodEnd: membership.currentPeriodEnd,
    prorationDays: remainingDays
  });
  
  // 更新会员记录
  MembershipCollection.update(membershipId, {
    $set: {
      membershipTypeId: newMembershipTypeId,
      currentPrice: newPrice,
      lastPaymentDate: now,
      updatedAt: now
    }
  });
  
  // 记录历史
  OrderHistoryCollection.insert({
    orderId,
    action: "upgraded",
    status: "completed",
    description: `从 ${currentType.name} 升级到 ${newType.name}`,
    operatorId: membership.userId
  });
  
  return {
    orderId,
    prorationAmount,
    effectiveDate: now
  };
}

// 降级订阅 - 当前周期结束后生效
export async function downgradeSubscription(membershipId, newMembershipTypeId) {
  const membership = MembershipCollection.findOne({ _id: membershipId });
  if (!membership || membership.status !== "active") {
    throw new Error("会员记录无效");
  }
  
  const newType = MembershipTypeCollection.findOne({ _id: newMembershipTypeId });
  if (!newType) {
    throw new Error("新会员类型不存在");
  }
  
  const newPrice = membership.billingCycle === "yearly" ? newType.yearlyPrice : newType.monthlyPrice;
  
  // 设置待处理变更
  MembershipCollection.update(membershipId, {
    $set: {
      pendingChange: {
        type: "downgrade",
        newMembershipTypeId,
        effectiveDate: membership.currentPeriodEnd,
        prorationAmount: 0
      },
      updatedAt: new Date()
    }
  });
  
  return {
    effectiveDate: membership.currentPeriodEnd,
    newMembershipType: newType.name
  };
}

// 取消订阅 - 当前周期结束失效
export async function cancelSubscription(membershipId, reason = "用户主动取消") {
  const membership = MembershipCollection.findOne({ _id: membershipId });
  if (!membership || membership.status !== "active") {
    throw new Error("会员记录无效");
  }
  
  const now = new Date();
  
  // 创建取消订单
  const orderNumber = generateOrderNumber("CAN");
  const orderId = OrderCollection.insert({
    userId: membership.userId,
    orderNumber,
    type: "cancellation",
    status: "completed",
    membershipId,
    membershipTypeId: membership.membershipTypeId,
    billingCycle: membership.billingCycle,
    subtotal: 0,
    totalAmount: 0,
    currency: membership.currency,
    effectiveDate: membership.currentPeriodEnd,
    cancelReason: reason,
    cancelledAt: now
  });
  
  // 更新会员记录
  MembershipCollection.update(membershipId, {
    $set: {
      autoRenew: false,
      cancelledAt: now,
      cancelReason: reason,
      cancelEffectiveDate: membership.currentPeriodEnd,
      pendingChange: {
        type: "cancel",
        effectiveDate: membership.currentPeriodEnd
      },
      updatedAt: now
    }
  });
  
  // 记录历史
  OrderHistoryCollection.insert({
    orderId,
    action: "cancelled",
    status: "completed",
    description: `订阅已取消，将在 ${moment(membership.currentPeriodEnd).format('YYYY-MM-DD')} 失效`,
    operatorId: membership.userId
  });
  
  return {
    orderId,
    effectiveDate: membership.currentPeriodEnd
  };
}

// 处理到期的变更
export async function processPendingChanges() {
  const now = new Date();
  const membershipsWithPendingChanges = MembershipCollection.find({
    "pendingChange.effectiveDate": { $lte: now },
    status: "active"
  }).fetch();
  
  for (const membership of membershipsWithPendingChanges) {
    const { pendingChange } = membership;
    
    if (pendingChange.type === "downgrade") {
      // 执行降级
      const newType = MembershipTypeCollection.findOne({ _id: pendingChange.newMembershipTypeId });
      const newPrice = membership.billingCycle === "yearly" ? newType.yearlyPrice : newType.monthlyPrice;
      
      MembershipCollection.update(membership._id, {
        $set: {
          membershipTypeId: pendingChange.newMembershipTypeId,
          currentPrice: newPrice,
          updatedAt: now
        },
        $unset: {
          pendingChange: ""
        }
      });
      
    } else if (pendingChange.type === "cancel") {
      // 执行取消
      MembershipCollection.update(membership._id, {
        $set: {
          status: "cancelled",
          updatedAt: now
        },
        $unset: {
          pendingChange: ""
        }
      });
    }
  }
  
  return membershipsWithPendingChanges.length;
}

// 获取用户当前订阅
export function getUserSubscription(userId) {
  const membership = MembershipCollection.findOne({
    userId,
    status: { $in: ["active", "past_due", "cancelled"] }
  }, {
    sort: { createdAt: -1 }
  });
  
  if (!membership) {
    return null;
  }
  
  const membershipType = MembershipTypeCollection.findOne({ _id: membership.membershipTypeId });
  
  return {
    ...membership,
    membershipType,
    daysUntilRenewal: membership.nextRenewalDate ? 
      Math.ceil((membership.nextRenewalDate - new Date()) / (1000 * 60 * 60 * 24)) : null,
    daysUntilExpiry: membership.currentPeriodEnd ? 
      Math.ceil((membership.currentPeriodEnd - new Date()) / (1000 * 60 * 60 * 24)) : null
  };
}

// 生成订单号
function generateOrderNumber(prefix = "ORD") {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}${year}${month}${day}${timestamp}`;
}
