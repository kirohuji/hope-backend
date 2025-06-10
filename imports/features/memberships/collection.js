import { Class } from "meteor/jagi:astronomy";

export const MembershipCollection = new Mongo.Collection("memberships");
export const MembershipTypeCollection = new Mongo.Collection("memberships_types");

// 用户订阅记录
export default Class.create({
  name: "Membership",
  collection: MembershipCollection,
  fields: {
    userId: { 
      type: String, 
      required: true,
      label: "用户ID" 
    },
    membershipTypeId: { 
      type: String, 
      required: true,
      label: "会员类型ID" 
    },
    // 订阅状态
    status: { 
      type: String, 
      default: "active",
      allowedValues: ["active", "expired", "cancelled", "past_due", "paused"],
      label: "状态"
    },
    // 当前周期信息
    currentPeriodStart: { 
      type: Date, 
      required: true,
      label: "当前周期开始时间" 
    },
    currentPeriodEnd: { 
      type: Date, 
      required: true,
      label: "当前周期结束时间" 
    },
    // 自动续订设置
    autoRenew: { 
      type: Boolean, 
      default: true,
      label: "自动续订" 
    },
    nextRenewalDate: { 
      type: Date,
      optional: true,
      label: "下次续订日期"
    },
    // 计费周期 (monthly/yearly)
    billingCycle: {
      type: String,
      allowedValues: ["monthly", "yearly"],
      default: "monthly",
      label: "计费周期"
    },
    // 价格信息
    currentPrice: { 
      type: Number, 
      default: 0,
      label: "当前价格" 
    },
    currency: { 
      type: String, 
      default: "CNY",
      label: "货币" 
    },
    // 待处理的变更
    pendingChange: {
      type: Object,
      optional: true,
      label: "待处理变更"
    },
    "pendingChange.type": {
      type: String,
      allowedValues: ["upgrade", "downgrade", "cancel"],
      optional: true
    },
    "pendingChange.newMembershipTypeId": {
      type: String,
      optional: true
    },
    "pendingChange.effectiveDate": {
      type: Date,
      optional: true
    },
    "pendingChange.prorationAmount": {
      type: Number,
      optional: true
    },
    // 取消信息
    cancelledAt: {
      type: Date,
      optional: true,
      label: "取消时间"
    },
    cancelReason: {
      type: String,
      optional: true,
      label: "取消原因"
    },
    cancelEffectiveDate: {
      type: Date,
      optional: true,
      label: "取消生效日期"
    },
    // 支付信息
    paymentMethod: { 
      type: String, 
      optional: true,
      label: "支付方式" 
    },
    lastPaymentDate: {
      type: Date,
      optional: true,
      label: "最后支付日期"
    },
    // 外部系统集成
    externalSubscriptionId: {
      type: String,
      optional: true,
      label: "外部订阅ID"
    },
    externalCustomerId: {
      type: String,
      optional: true,
      label: "外部客户ID"
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

// 会员类型定义
export const MembershipType = Class.create({
  name: "MembershipType",
  collection: MembershipTypeCollection,
  fields: {  
    value: String,
    label: String,
    price: String,
    name: { 
      type: String, 
      required: true,
      label: "名称" 
    },
    identifier: { 
      type: String, 
      required: true,
      unique: true,
      label: "标识符" 
    },
    description: { 
      type: String, 
      optional: true,
      label: "描述" 
    },
    // 价格信息
    monthlyPrice: { 
      type: Number, 
      required: true,
      min: 0,
      label: "月价格" 
    },
    yearlyPrice: { 
      type: Number, 
      required: true,
      min: 0,
      label: "年价格" 
    },
    currency: { 
      type: String, 
      default: "CNY",
      label: "货币" 
    },
    isActive: { 
      type: Boolean, 
      default: true,
      label: "是否启用" 
    },
    isPublic: {
      type: Boolean,
      default: true,
      label: "是否公开显示"
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
