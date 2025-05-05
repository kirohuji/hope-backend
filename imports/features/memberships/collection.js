import { Class } from "meteor/jagi:astronomy";
export const MembershipCollection = new Mongo.Collection("memberships");
export const MembershipTypeCollection = new Mongo.Collection(
  "memberships_types"
);

export default Class.create({
  name: "Membership",
  collection: MembershipCollection,
  fields: {
    type: { type: String, default: "basic" },
    status: { type: String, default: "active" },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    currency: { type: String, default: "CNY" },
    autoRenew: { type: Boolean, default: false },
    price: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    paymentMethod: { type: String, default: "" },
    transactionId: { type: String }, // 支付平台返回的交易ID
    membershipTypeId: { type: String, default: "" },
    orderId: { type: String, default: "" },
    createdBy: { type: String, default: "" },
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

export const MembershipType = Class.create({
  name: "MembershipType",
  collection: MembershipTypeCollection,
  fields: {
    value: String,
    label: String,
    price: String,
    description: String,
  },
});
