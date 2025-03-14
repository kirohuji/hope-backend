import { Class } from "meteor/jagi:astronomy";
export const OrderCollection = new Mongo.Collection("orders");
export const OrderHistoryCollection = new Mongo.Collection("orders_history");
export const PaymentCollection = new Mongo.Collection("payments");
export const OrderItemCollection = new Mongo.Collection("orders_items");
export const TransactionCollection = new Mongo.Collection("transactions");

export default Class.create({
  name: "Order",
  collection: OrderCollection,
  fields: {
    userId: {
      type: String,
    },
    value: {
      type: String,
      default: "",
    },
    label: {
      type: String,
      default: "",
      label: "名称",
    },
    description: {
      type: String,
      default: "",
    },
    orderNumber: {
      type: String,
      default: "",
    },
    taxes: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "",
    },
    totalQuantity: {
      type: Number,
      default: "",
    },
    createdBy: {
      type: String,
      default: "",
    },
    scope: {
      type: String,
      default: "",
    },
  },
  behaviors: {
    timestamp: {
      hasCreatedField: true,
      createdFieldName: "createdAt",
      hasUpdatedField: true,
      updatedFieldName: "updatedAt",
    },
    softremove: {
      // The field name with a flag for marking a document as removed.
      removedFieldName: "removed",
      // A flag indicating if a "removedAt" field should be present in a document.
      hasRemovedAtField: true,
      // The field name storing the removal date.
      removedAtFieldName: "removedAt",
    },
  },
});

export const OrderItem = Class.create({
  name: "OrderItem",
  collection: OrderItemCollection,
  fields: {
    orderId: {
      type: String,
    },
    linkedObjectId: {
      type: String,
      default: "",
    },
    objectType: {
      type: String,
      default: "",
    },
    quantity: {
      type: Number,
      default: "",
    },
    unitPrice: {
      type: String,
      default: "",
    },
    createdBy: {
      type: String,
      default: "",
    },
    scope: {
      type: String,
      default: "",
    },
  },
  behaviors: {
    timestamp: {
      hasCreatedField: true,
      createdFieldName: "createdAt",
      hasUpdatedField: true,
      updatedFieldName: "updatedAt",
    },
    softremove: {
      // The field name with a flag for marking a document as removed.
      removedFieldName: "removed",
      // A flag indicating if a "removedAt" field should be present in a document.
      hasRemovedAtField: true,
      // The field name storing the removal date.
      removedAtFieldName: "removedAt",
    },
  },
});
