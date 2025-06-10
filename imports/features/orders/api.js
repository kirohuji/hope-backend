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
  cancelSubscriptionPayment,
  upgradeSubscription, 
  downgradeSubscription, 
  cancelSubscription,
  getUserSubscription,
  processAutoRenewal,
  processPendingChanges,
  changeSubscription,
  previewSubscriptionChange
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

Api.addRoute("orders/info", {
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

Api.addRoute("orders/subscriptions", {
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

Api.addRoute("orders/subscriptions/change", {
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

        // 查找用户未支付的订单
        const pendingOrder = OrderCollection.findOne({
          userId: this.userId,
          status: "pending",
          // type: "subscription"
        });

        // 如果存在未支付订单，先取消它
        if (pendingOrder) {
          cancelSubscriptionPayment(pendingOrder._id, "用户重新下单");
        }
        
        return changeSubscription(this.userId, membershipTypeId, billingCycle, paymentMethod);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("subscriptions/preview-change", {
  post: {
    authRequired: true,
    action: function () {
      try {
        const { membershipTypeId, billingCycle } = this.bodyParams;
        
        if (!membershipTypeId || !billingCycle) {
          return {
            statusCode: 400,
            body: {
              code: 400,
              message: "membershipTypeId and billingCycle are required"
            }
          };
        }
        
        return previewSubscriptionChange(this.userId, membershipTypeId, billingCycle);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("orders/:_id/subscriptions/complete-payment", {
  post: {
    authRequired: true,
    action: function () {
      try {
        const { transactionId } = this.bodyParams;
        
        if (!this.urlParams._id) {
          return {
            statusCode: 400,
            body: {
              code: 400,
              message: "orderId and transactionId are required"
            }
          };
        }
        
        return completeSubscriptionPayment(this.urlParams._id, transactionId);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("orders/subscriptions/:_id/cancel", {
  post: {
    authRequired: true,
    action: function () {
      try {
        const { reason } = this.bodyParams;
        
        if (!this.urlParams._id) {
          return {
            statusCode: 400,
            body: {
              code: 400,
              message: "membershipId is required"
            }
          };
        }
        
        return cancelSubscription(this.urlParams._id, this.userId, reason);
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

Api.addRoute("orders/:_id/subscriptions/cancel-payment", {
  post: {
    authRequired: true,
    action: function () {
      try {
        const { reason } = this.bodyParams;
        
        if (!this.urlParams._id) {
          return {
            statusCode: 400,
            body: {
              code: 400,
              message: "orderId is required"
            }
          };
        }
        
        return cancelSubscriptionPayment(this.urlParams._id, reason);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute('orders/subscriptions/sync', {
  post: {
    authRequired: true,
    action: async function() {
      const { platform, platformSubscriptionId, status, event } = this.bodyParams;
      
      // 查找用户现有的会员记录
      const membership = MembershipCollection.findOne({
        userId: this.userId,
        status: { $in: ["active", "past_due"] }
      });

      if (membership) {
        // 更新现有会员记录
        MembershipCollection.update(membership._id, {
          $set: {
            status: status,
            platform: platform,
            platformSubscriptionId: platformSubscriptionId,
            updatedAt: new Date()
          }
        });
      } else {
        // 创建新的会员记录
        MembershipCollection.insert({
          userId: this.userId,
          platform: platform,
          platformSubscriptionId: platformSubscriptionId,
          status: status,
          createdAt: new Date()
        });
      }

      return {
        code: 200,
        message: 'Subscription synced successfully'
      };
    }
  }
});