import { Class } from "meteor/jagi:astronomy";

export const OrderCollection = new Mongo.Collection("orders");
export const OrderHistoryCollection = new Mongo.Collection("orders_history");
export const OrderItemCollection = new Mongo.Collection("orders_items");

// 订单主表 - 简化为订阅相关订单
export default Class.create({
  name: "Order",
  collection: OrderCollection,
  fields: {
    // 基本信息
    userId: {
      type: String,
      required: true,
      label: "用户ID"
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      label: "订单号"
    },
    // 订单类型
    type: {
      type: String,
      allowedValues: [
        "subscription",    // 首次订阅
        "renewal",         // 自动续订
        "upgrade",         // 升级订阅
        "downgrade",       // 降级订阅
        "cancellation"     // 取消订阅
      ],
      required: true,
      label: "订单类型"
    },
    // 订单状态
    status: {
      type: String,
      allowedValues: ["pending", "completed", "failed", "cancelled", "refunded"],
      default: "pending",
      label: "订单状态"
    },
    // 订阅信息
    membershipId: {
      type: String,
      optional: true,
      label: "关联的会员记录ID"
    },
    membershipTypeId: {
      type: String,
      required: true,
      label: "会员类型ID"
    },
    billingCycle: {
      type: String,
      allowedValues: ["monthly", "yearly"],
      required: true,
      label: "计费周期"
    },
    // 价格信息
    subtotal: {
      type: Number,
      required: true,
      min: 0,
      label: "小计"
    },
    prorationAmount: {
      type: Number,
      default: 0,
      label: "按比例计费金额"
    },
    discountAmount: {
      type: Number,
      default: 0,
      label: "折扣金额"
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
      label: "总金额"
    },
    currency: {
      type: String,
      default: "CNY",
      label: "货币"
    },
    // 支付信息
    paymentMethod: {
      type: String,
      optional: true,
      label: "支付方式"
    },
    transactionId: {
      type: String,
      optional: true,
      label: "交易ID"
    },
    paidAt: {
      type: Date,
      optional: true,
      label: "支付时间"
    },
    // 生效时间
    effectiveDate: {
      type: Date,
      optional: true,
      label: "生效日期"
    },
    // 取消信息
    cancelReason: {
      type: String,
      optional: true,
      label: "取消原因"
    },
    cancelledAt: {
      type: Date,
      optional: true,
      label: "取消时间"
    },
    // 退款信息
    refundAmount: {
      type: Number,
      optional: true,
      label: "退款金额"
    },
    refundedAt: {
      type: Date,
      optional: true,
      label: "退款时间"
    },
    refundReason: {
      type: String,
      optional: true,
      label: "退款原因"
    },
    // 外部系统
    externalOrderId: {
      type: String,
      optional: true,
      label: "外部订单ID"
    },
    // 元数据
    metadata: {
      type: Object,
      optional: true,
      label: "元数据"
    }
  },
  behaviors: {
    timestamp: {
      hasCreatedField: true,
      createdFieldName: "createdAt",
      hasUpdatedField: true,
      updatedFieldName: "updatedAt",
    },
    softremove: {
      removedFieldName: "removed",
      hasRemovedAtField: true,
      removedAtFieldName: "removedAt",
    },
  },
});

// 订单项 - 简化版本
export const OrderItem = Class.create({
  name: "OrderItem",
  collection: OrderItemCollection,
  fields: {
    orderId: {
      type: String,
      required: true,
      label: "订单ID"
    },
    membershipTypeId: {
      type: String,
      required: true,
      label: "会员类型ID"
    },
    billingCycle: {
      type: String,
      allowedValues: ["monthly", "yearly"],
      required: true,
      label: "计费周期"
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
      label: "单价"
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
      label: "数量"
    },
    // 时间范围
    periodStart: {
      type: Date,
      optional: true,
      label: "服务开始时间"
    },
    periodEnd: {
      type: Date,
      optional: true,
      label: "服务结束时间"
    },
    // 按比例计费信息
    prorationDays: {
      type: Number,
      optional: true,
      label: "按比例计费天数"
    }
  },
  behaviors: {
    timestamp: {
      hasCreatedField: true,
      createdFieldName: "createdAt",
      hasUpdatedField: true,
      updatedFieldName: "updatedAt",
    },
    softremove: {
      removedFieldName: "removed",
      hasRemovedAtField: true,
      removedAtFieldName: "removedAt",
    },
  },
});

// 订单历史记录
export const OrderHistory = Class.create({
  name: "OrderHistory",
  collection: OrderHistoryCollection,
  fields: {
    orderId: {
      type: String,
      required: true,
      label: "订单ID"
    },
    action: {
      type: String,
      allowedValues: [
        "created", "paid", "completed", "failed", 
        "cancelled", "refunded", "upgraded", "downgraded"
      ],
      required: true,
      label: "操作"
    },
    status: {
      type: String,
      optional: true,
      label: "状态"
    },
    description: {
      type: String,
      optional: true,
      label: "描述"
    },
    metadata: {
      type: Object,
      optional: true,
      label: "元数据"
    },
    operatorId: {
      type: String,
      optional: true,
      label: "操作人ID"
    }
  },
  behaviors: {
    timestamp: {
      hasCreatedField: true,
      createdFieldName: "createdAt",
      hasUpdatedField: false,
    },
  },
});
