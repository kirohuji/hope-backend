import { MembershipCollection, MembershipTypeCollection } from "./collection";
import { OrderCollection, OrderItemCollection, OrderHistoryCollection } from "../orders/collection";
import { ProfilesCollection } from "meteor/socialize:user-profile";
import _ from "lodash";
import moment from "moment";

// 价格计算辅助函数
function calculatePrice(membershipType, billingCycle) {
  return billingCycle === "yearly" ? membershipType.price * 10 : membershipType.price;
}

// 计算周期结束时间
function calculatePeriodEnd(startDate, billingCycle) {
  const start = new Date(startDate);
  return billingCycle === "yearly"
    ? new Date(start.getFullYear() + 1, start.getMonth(), start.getDate())
    : new Date(start.getFullYear(), start.getMonth() + 1, start.getDate());
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

// 创建订阅 - 返回待支付订单
export async function createSubscription(userId, membershipTypeId, billingCycle, paymentMethod = "alipay") {
  // 检查用户是否已有活跃订阅
  const existingMembership = MembershipCollection.findOne({
    userId,
    status: { $in: ["active", "past_due"] }
  });

  if (existingMembership) {
    throw new Error("用户已有活跃订阅");
  }

  const membershipType = MembershipTypeCollection.findOne({ _id: membershipTypeId });
  if (!membershipType) {
    throw new Error("会员类型不存在");
  }

  const price = calculatePrice(membershipType, billingCycle);
  const now = new Date();
  const periodEnd = calculatePeriodEnd(now, billingCycle);

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
    createdAt: now,
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
    details: {
      currentType: membershipType.label,
      newType: membershipType.label,
      currentBillingCycle: billingCycle,
      newBillingCycle: billingCycle,
      priceChange: price
    },
    paymentAmount: price,
    billingCycle,
    effectiveDate: now,
    periodEnd
  };
}

// 完成支付并激活订阅
export async function completeSubscriptionPayment(orderId, transactionId) {
  const order = OrderCollection.findOne({ _id: orderId });
  if (!order || order.status !== "pending") {
    throw new Error("订单状态无效或订单不存在");
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

  let result;

  if (order.type === "subscription") {
    // 处理新订阅 - 创建会员记录
    const orderItem = OrderItemCollection.findOne({ orderId });
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
      lastPaymentDate: now,
      createdAt: now
    });

    OrderCollection.update(orderId, { $set: { membershipId } });
    result = { membershipId, status: "active", type: "subscription" };

  } else if (order.type === "upgrade") {
    // 处理升级订单 - 更新会员记录
    const membership = MembershipCollection.findOne({ _id: order.membershipId });
    if (!membership) {
      throw new Error("关联的会员记录不存在");
    }

    // 使用订单中存储的新的完整价格，而不是按比例的金额
    const newFullPrice = order.upgradeInfo?.newFullPrice || order.totalAmount;

    MembershipCollection.update(order.membershipId, {
      $set: {
        membershipTypeId: order.membershipTypeId,
        billingCycle: order.billingCycle,
        currentPrice: newFullPrice, // 使用新的完整价格
        lastPaymentDate: now,
        updatedAt: now
      }
    });

    result = { 
      membershipId: order.membershipId, 
      status: "upgraded", 
      type: "upgrade",
      newMembershipTypeId: order.membershipTypeId,
      newBillingCycle: order.billingCycle,
      newFullPrice: newFullPrice
    };

  } else {
    throw new Error(`不支持的订单类型: ${order.type}`);
  }

  // 记录历史
  const historyDescription = order.type === "subscription" 
    ? "订阅支付完成，会员已激活"
    : "升级支付完成，已升级到新的会员类型";

  OrderHistoryCollection.insert({
    orderId,
    action: "completed",
    status: "completed",
    description: historyDescription,
    operatorId: order.userId
  });

  return result;
}

// 取消支付并回滚状态
export async function cancelSubscriptionPayment(orderId, reason = "用户取消支付") {
  const order = OrderCollection.findOne({ _id: orderId });
  if (!order || order.status !== "pending") {
    throw new Error("订单状态无效或订单不存在");
  }

  const now = new Date();

  // 更新订单状态为已取消
  OrderCollection.update(orderId, {
    $set: {
      status: "cancelled",
      cancelReason: reason,
      cancelledAt: now,
      updatedAt: now
    }
  });

  // 记录历史
  OrderHistoryCollection.insert({
    orderId,
    action: "cancelled",
    status: "cancelled",
    description: `支付已取消: ${reason}`,
    operatorId: order.userId
  });

  return {
    orderId,
    type: order.type,
    status: "cancelled",
    message: order.type === "subscription" ? "订阅订单已取消" : "升级订单已取消，会员状态保持不变"
  };
}

// 升级订阅 - 创建待支付升级订单
export async function upgradeSubscription(membershipId, newMembershipTypeId, newBillingCycle = null) {
  const membership = MembershipCollection.findOne({ _id: membershipId });
  if (!membership || membership.status !== "active") {
    throw new Error("会员记录无效");
  }

  const currentType = MembershipTypeCollection.findOne({ _id: membership.membershipTypeId });
  const newType = MembershipTypeCollection.findOne({ _id: newMembershipTypeId });

  if (!currentType || !newType) {
    throw new Error("会员类型不存在");
  }

  // 如果没有指定新的计费周期，使用当前的计费周期
  const targetBillingCycle = newBillingCycle || membership.billingCycle;

  // 计算按比例计费
  const now = new Date();
  const totalDays = Math.ceil((membership.currentPeriodEnd - membership.currentPeriodStart) / (1000 * 60 * 60 * 24));
  const remainingDays = Math.ceil((membership.currentPeriodEnd - now) / (1000 * 60 * 60 * 24));

  const currentPrice = calculatePrice(currentType, membership.billingCycle);
  const newPrice = calculatePrice(newType, targetBillingCycle); // 使用目标计费周期计算新价格

  // 计算退款和新费用
  const refundAmount = (currentPrice / totalDays) * remainingDays;
  const newChargeAmount = (newPrice / totalDays) * remainingDays;
  const prorationAmount = newChargeAmount - refundAmount;

  // 创建升级订单 - 状态为pending，等待支付
  const orderNumber = generateOrderNumber("UPG");
  const orderId = OrderCollection.insert({
    userId: membership.userId,
    orderNumber,
    type: "upgrade",
    status: "pending",
    membershipId,
    membershipTypeId: newMembershipTypeId,
    billingCycle: targetBillingCycle, // 使用目标计费周期
    subtotal: newChargeAmount,
    prorationAmount,
    discountAmount: refundAmount,
    totalAmount: prorationAmount,
    currency: membership.currency,
    paymentMethod: membership.paymentMethod,
    effectiveDate: now,
    createdAt: now,
    // 存储变更信息以便支付完成后使用
    upgradeInfo: {
      originalBillingCycle: membership.billingCycle,
      newBillingCycle: targetBillingCycle,
      newFullPrice: newPrice // 存储新的完整价格
    }
  });

  // 创建订单项
  OrderItemCollection.insert({
    orderId,
    membershipTypeId: newMembershipTypeId,
    billingCycle: targetBillingCycle,
    unitPrice: newPrice,
    quantity: 1,
    periodStart: now,
    periodEnd: membership.currentPeriodEnd,
    prorationDays: remainingDays
  });

  // 记录历史
  OrderHistoryCollection.insert({
    orderId,
    action: "created",
    status: "pending",
    description: `创建升级订单：从 ${currentType.label}(${membership.billingCycle}) 升级到 ${newType.label}(${targetBillingCycle})`,
    operatorId: membership.userId
  });

  return {
    orderId,
    orderNumber,
    prorationAmount,
    totalAmount: prorationAmount,
    paymentAmount: prorationAmount,
    effectiveDate: now,
    status: "pending",
    billingCycleChange: membership.billingCycle !== targetBillingCycle,
    newFullPrice: newPrice // 返回新的完整价格信息
  };
}

// 降级订阅 - 当前周期结束后生效
export async function downgradeSubscription(membershipId, newMembershipTypeId) {
  const membership = MembershipCollection.findOne({ _id: membershipId });
  if (!membership || membership.status !== "active") {
    throw new Error("会员记录无效");
  }

  const currentType = MembershipTypeCollection.findOne({ _id: membership.membershipTypeId });
  const newType = MembershipTypeCollection.findOne({ _id: newMembershipTypeId });
  
  if (!currentType || !newType) {
    throw new Error("会员类型不存在");
  }

  const now = new Date();

  // 创建降级订单 - 无需支付，直接完成
  const orderNumber = generateOrderNumber("DWG");
  const orderId = OrderCollection.insert({
    userId: membership.userId,
    orderNumber,
    type: "downgrade",
    status: "completed",
    membershipId,
    membershipTypeId: newMembershipTypeId,
    billingCycle: membership.billingCycle,
    subtotal: 0,
    totalAmount: 0,
    currency: membership.currency,
    effectiveDate: membership.currentPeriodEnd,
    createdAt: now
  });

  // 设置待处理变更
  MembershipCollection.update(membershipId, {
    $set: {
      pendingChange: {
        type: "downgrade",
        newMembershipTypeId,
        effectiveDate: membership.currentPeriodEnd,
        orderId
      },
      updatedAt: now
    }
  });

  // 记录历史
  OrderHistoryCollection.insert({
    orderId,
    action: "downgrade_scheduled",
    status: "completed",
    description: `安排降级：从 ${currentType.name} 降级到 ${newType.name}，将在 ${membership.currentPeriodEnd.toISOString().split('T')[0]} 生效`,
    operatorId: membership.userId
  });

  return {
    orderId,
    orderNumber,
    effectiveDate: membership.currentPeriodEnd,
    newMembershipType: newType.name,
    currentType: currentType.name
  };
}

// 取消订阅 - 当前周期结束失效
export async function cancelSubscription(membershipId, userId, reason = "用户主动取消") {
  const membership = MembershipCollection.findOne({ 
    membershipTypeId: membershipId, 
    userId: userId, 
    status: "active" 
  });
  
  if (!membership) {
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
    membershipId: membership._id,
    membershipTypeId: membership.membershipTypeId,
    billingCycle: membership.billingCycle,
    subtotal: 0,
    totalAmount: 0,
    currency: membership.currency,
    effectiveDate: membership.currentPeriodEnd,
    cancelReason: reason,
    cancelledAt: now,
    createdAt: now
  });

  // 更新会员记录
  MembershipCollection.update(membership._id, {
    $set: {
      autoRenew: false,
      cancelledAt: now,
      cancelReason: reason,
      cancelEffectiveDate: membership.currentPeriodEnd,
      pendingChange: {
        type: "cancel",
        effectiveDate: membership.currentPeriodEnd,
        orderId
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

// 自动续订
export async function processAutoRenewal(membershipId) {
  const membership = MembershipCollection.findOne({ _id: membershipId });
  if (!membership || !membership.autoRenew || membership.status !== "active") {
    return false;
  }

  const now = new Date();
  if (now < membership.nextRenewalDate) {
    return false;
  }

  const membershipType = MembershipTypeCollection.findOne({
    _id: membership.membershipTypeId
  });

  if (!membershipType) {
    throw new Error("会员类型不存在");
  }

  const newPeriodStart = membership.currentPeriodEnd;
  const newPeriodEnd = calculatePeriodEnd(newPeriodStart, membership.billingCycle);
  const price = calculatePrice(membershipType, membership.billingCycle);

  // 创建续订订单
  const orderNumber = generateOrderNumber("REN");
  const orderId = OrderCollection.insert({
    userId: membership.userId,
    orderNumber,
    type: "renewal",
    status: "completed",
    membershipId,
    membershipTypeId: membership.membershipTypeId,
    billingCycle: membership.billingCycle,
    subtotal: price,
    totalAmount: price,
    currency: membership.currency,
    paymentMethod: membership.paymentMethod,
    effectiveDate: newPeriodStart,
    paidAt: now,
    createdAt: now
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
      const newType = MembershipTypeCollection.findOne({ _id: pendingChange.newMembershipTypeId });
      const newBillingCycle = pendingChange.newBillingCycle || membership.billingCycle;
      const newPrice = calculatePrice(newType, newBillingCycle);

      // 创建降级生效订单
      const orderNumber = generateOrderNumber("DWG_EFF");
      const orderId = OrderCollection.insert({
        userId: membership.userId,
        orderNumber,
        type: "downgrade_effective",
        status: "completed",
        membershipId: membership._id,
        membershipTypeId: pendingChange.newMembershipTypeId,
        billingCycle: newBillingCycle,
        subtotal: 0,
        totalAmount: 0,
        currency: membership.currency,
        effectiveDate: now,
        createdAt: now,
        description: "降级订阅生效"
      });

      MembershipCollection.update(membership._id, {
        $set: {
          membershipTypeId: pendingChange.newMembershipTypeId,
          billingCycle: newBillingCycle,
          currentPrice: newPrice,
          updatedAt: now
        },
        $unset: { pendingChange: "" }
      });

      OrderHistoryCollection.insert({
        orderId,
        action: "downgrade_effective",
        status: "completed",
        description: `降级到 ${newType.name} 已生效`,
        operatorId: membership.userId
      });

    } else if (pendingChange.type === "cancel") {
      const orderNumber = generateOrderNumber("EXP");
      const orderId = OrderCollection.insert({
        userId: membership.userId,
        orderNumber,
        type: "subscription_expired",
        status: "completed",
        membershipId: membership._id,
        membershipTypeId: membership.membershipTypeId,
        billingCycle: membership.billingCycle,
        subtotal: 0,
        totalAmount: 0,
        currency: membership.currency,
        effectiveDate: now,
        createdAt: now,
        description: "订阅到期失效"
      });

      MembershipCollection.update(membership._id, {
        $set: { status: "cancelled", updatedAt: now },
        $unset: { pendingChange: "" }
      });

      OrderHistoryCollection.insert({
        orderId,
        action: "expired",
        status: "completed",
        description: "订阅已到期失效",
        operatorId: membership.userId
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

// 智能订阅变更 - 自动判断升级/降级/立即生效
export async function changeSubscription(userId, newMembershipTypeId, newBillingCycle, paymentMethod = "alipay") {
  const currentMembership = MembershipCollection.findOne({
    userId,
    status: { $in: ["active", "past_due"] }
  });

  if (!currentMembership) {
    // 如果用户没有当前订阅，创建新订阅
    const subscriptionResult = await createSubscription(userId, newMembershipTypeId, newBillingCycle, paymentMethod);
    return {
      action: "create_new",
      effectiveImmediately: false,
      message: "已创建新订阅，请完成支付",
      ...subscriptionResult,
    };
  }

  const currentType = MembershipTypeCollection.findOne({ _id: currentMembership.membershipTypeId });
  const newType = MembershipTypeCollection.findOne({ _id: newMembershipTypeId });

  if (!currentType || !newType) {
    throw new Error("会员类型信息不存在");
  }

  const currentPrice = calculatePrice(currentType, currentMembership.billingCycle);
  const newPrice = calculatePrice(newType, newBillingCycle);

  // 如果是相同的会员类型和计费周期，无需变更
  if (currentMembership.membershipTypeId === newMembershipTypeId && 
      currentMembership.billingCycle === newBillingCycle) {
    return {
      action: "no_change",
      message: "订阅无需变更",
      currentSubscription: currentMembership
    };
  }

  // 判断变更类型
  let changeType;
  if (newPrice > currentPrice) {
    changeType = "upgrade";
  } else if (newPrice < currentPrice) {
    changeType = "downgrade";
  } else {
    // 价格相同但类型或周期不同
    changeType = currentMembership.billingCycle === "monthly" && newBillingCycle === "yearly" 
      ? "upgrade" : "downgrade";
  }

  let result;
  
  if (changeType === "upgrade") {
    // 升级 - 立即生效，需要支付差价
    result = await upgradeSubscription(currentMembership._id, newMembershipTypeId, newBillingCycle);
    
    return {
      action: "upgrade",
      effectiveImmediately: false, // 需要支付完成才生效
      message: `已创建升级订单到 ${newType.label}，请完成支付`,
      ...result,
      details: {
        currentType: currentType.label,
        newType: newType.label,
        currentBillingCycle: currentMembership.billingCycle,
        newBillingCycle: newBillingCycle,
        priceChange: newPrice - currentPrice
      }
    };
    
  } else {
    // 降级 - 周期结束生效
    result = await downgradeSubscription(currentMembership._id, newMembershipTypeId);
    
    // 如果计费周期也发生变化，记录在待处理变更中
    if (currentMembership.billingCycle !== newBillingCycle) {
      MembershipCollection.update(currentMembership._id, {
        $set: {
          "pendingChange.newBillingCycle": newBillingCycle,
          updatedAt: new Date()
        }
      });
    }
    
    return {
      action: "downgrade",
      effectiveImmediately: false,
      message: `已安排降级到 ${newType.label}，将在当前周期结束后生效`,
      ...result,
      details: {
        currentType: currentType.label,
        newType: newType.label,
        currentBillingCycle: currentMembership.billingCycle,
        newBillingCycle: newBillingCycle,
        priceChange: newPrice - currentPrice
      }
    };
  }
}

// 获取订阅变更预览
export function previewSubscriptionChange(userId, newMembershipTypeId, newBillingCycle) {
  const currentMembership = MembershipCollection.findOne({
    userId,
    status: { $in: ["active", "past_due"] }
  });

  if (!currentMembership) {
    throw new Error("用户暂无活跃订阅");
  }

  const currentType = MembershipTypeCollection.findOne({ _id: currentMembership.membershipTypeId });
  const newType = MembershipTypeCollection.findOne({ _id: newMembershipTypeId });

  if (!currentType || !newType) {
    throw new Error("会员类型信息不存在");
  }

  const currentPrice = calculatePrice(currentType, currentMembership.billingCycle);
  const newPrice = calculatePrice(newType, newBillingCycle);

  let changeType;
  let effectiveImmediately = false;
  let prorationAmount = 0;

  if (currentMembership.membershipTypeId === newMembershipTypeId && 
      currentMembership.billingCycle === newBillingCycle) {
    changeType = "no_change";
  } else if (newPrice > currentPrice) {
    changeType = "upgrade";
    effectiveImmediately = false; // 需要支付完成
    
    // 计算按比例费用
    const now = new Date();
    const totalDays = Math.ceil((currentMembership.currentPeriodEnd - currentMembership.currentPeriodStart) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.ceil((currentMembership.currentPeriodEnd - now) / (1000 * 60 * 60 * 24));
    
    const refundAmount = (currentPrice / totalDays) * remainingDays;
    const newChargeAmount = (newPrice / totalDays) * remainingDays;
    prorationAmount = newChargeAmount - refundAmount;
    
  } else {
    changeType = "downgrade";
    effectiveImmediately = false;
  }

  return {
    changeType,
    effectiveImmediately,
    effectiveDate: effectiveImmediately ? new Date() : currentMembership.currentPeriodEnd,
    prorationAmount,
    currentSubscription: {
      type: currentType.name,
      billingCycle: currentMembership.billingCycle,
      price: currentPrice
    },
    newSubscription: {
      type: newType.name,
      billingCycle: newBillingCycle,
      price: newPrice
    },
    priceChange: newPrice - currentPrice,
    savings: currentPrice - newPrice
  };
}
