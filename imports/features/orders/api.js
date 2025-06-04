import Api from "../../api";
import Constructor, { serverError500 } from "../base/api";
import Model, {
  OrderItem,
  OrderItemCollection,
  OrderCollection,
} from "./collection";
import { pagination, getOrderInfo, getUserOrders, updateOrderStatus, generateOrderPDF, cancelOrder } from "./service";
import { 
  createSubscription, 
  completeSubscriptionPayment, 
  upgradeSubscription, 
  downgradeSubscription, 
  cancelSubscription,
  getUserSubscription,
  processAutoRenewal,
  processPendingChanges
} from "../memberships/service";
import _ from "lodash";

Api.addCollection(OrderCollection, {
  path: "orders",
});

Constructor("orders", Model);

Api.addCollection(OrderItemCollection, {
  path: "orders/items",
});

Constructor("orders/items", OrderItem);

Api.addRoute("orders/pagination", {
  post: function () {
    try {
      return pagination(this.bodyParams);
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

Api.addRoute("orders/:_id", {
  get: function () {
    try {
      return getOrderInfo(this.urlParams.id || this.urlParams._id);
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

Api.addRoute("orders/my", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return getUserOrders(this.userId);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("subscriptions/create", {
  post: {
    authRequired: true,
    action: function () {
      try {
        const { membershipTypeId, billingCycle, paymentMethod } = this.bodyParams;
        
        if (!membershipTypeId || !billingCycle) {
          return {
            statusCode: 400,
            body: {
              code: 400,
              message: "membershipTypeId and billingCycle are required"
            }
          };
        }
        
        return createSubscription(this.userId, membershipTypeId, billingCycle, paymentMethod);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("subscriptions/complete-payment", {
  post: {
    authRequired: true,
    action: function () {
      try {
        const { orderId, transactionId } = this.bodyParams;
        
        if (!orderId || !transactionId) {
          return {
            statusCode: 400,
            body: {
              code: 400,
              message: "orderId and transactionId are required"
            }
          };
        }
        
        return completeSubscriptionPayment(orderId, transactionId);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("subscriptions/current", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return getUserSubscription(this.userId);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("subscriptions/upgrade", {
  post: {
    authRequired: true,
    action: function () {
      try {
        const { membershipId, newMembershipTypeId } = this.bodyParams;
        
        if (!membershipId || !newMembershipTypeId) {
          return {
            statusCode: 400,
            body: {
              code: 400,
              message: "membershipId and newMembershipTypeId are required"
            }
          };
        }
        
        return upgradeSubscription(membershipId, newMembershipTypeId);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("subscriptions/downgrade", {
  post: {
    authRequired: true,
    action: function () {
      try {
        const { membershipId, newMembershipTypeId } = this.bodyParams;
        
        if (!membershipId || !newMembershipTypeId) {
          return {
            statusCode: 400,
            body: {
              code: 400,
              message: "membershipId and newMembershipTypeId are required"
            }
          };
        }
        
        return downgradeSubscription(membershipId, newMembershipTypeId);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("subscriptions/cancel", {
  post: {
    authRequired: true,
    action: function () {
      try {
        const { membershipId, reason } = this.bodyParams;
        
        if (!membershipId) {
          return {
            statusCode: 400,
            body: {
              code: 400,
              message: "membershipId is required"
            }
          };
        }
        
        return cancelSubscription(membershipId, reason);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("subscriptions/process-renewals", {
  post: {
    authRequired: false,
    action: function () {
      try {
        const renewalsProcessed = processAutoRenewal();
        return {
          success: true,
          renewalsProcessed
        };
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("subscriptions/process-pending-changes", {
  post: {
    authRequired: false,
    action: function () {
      try {
        const changesProcessed = processPendingChanges();
        return {
          success: true,
          changesProcessed
        };
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("orders/:_id/cancel", {
  post: {
    authRequired: true,
    action: function () {
      try {
        const orderId = this.urlParams.id || this.urlParams._id;
        const { reason } = this.bodyParams;
        return cancelOrder(orderId, this.userId, reason);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("orders/:_id/pdf", {
  get: async function () {
    try {
      const orderId = this.urlParams.id || this.urlParams._id;
      const pdfBuffer = await generateOrderPDF(orderId);
      
      // 设置响应头
      this.response.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=order-${orderId}.pdf`,
        'Content-Length': pdfBuffer.length
      });
      
      // 发送 PDF 数据
      this.response.end(pdfBuffer);
      
      return null; // 响应已经发送
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});
