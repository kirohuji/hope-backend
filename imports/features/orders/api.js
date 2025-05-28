import Api from "../../api";
import Constructor, { serverError500 } from "../base/api";
import Model, {
  OrderItem,
  OrderItemCollection,
  OrderCollection,
} from "./collection";
import { pagination, paginationWithMembership, info, getUserOrders, handleMembershipChange, handleMembershipChangePayment, updateOrderStatus, generateOrderPDF, cancelOrder } from "./service";
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

Api.addRoute("orders/pagination-with-membership", {
  post: function () {
    try {
      return paginationWithMembership(this.bodyParams);
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
      return info(this.urlParams.id || this.urlParams._id);
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

Api.addRoute("orders/change-membership", {
  post: {
    authRequired: true,
    action: function () {
      try {
        const { planId, isYearly } = this.bodyParams;
        if (!planId) {
          return {
            statusCode: 400,
            body: {
              code: 400,
              message: "planId is required"
            }
          };
        }
        return handleMembershipChange(this.userId, planId, isYearly);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("orders/complete-membership-change", {
  post: {
    authRequired: true,
    action: function () {
      try {
        const { orderId, transactionId } = this.bodyParams;
        console.log(this.bodyParams);
        if (!orderId) {
          return {
            statusCode: 400,
            body: {
              code: 400,
              message: "orderId and transactionId are required"
            }
          };
        }

        // 更新订单状态为已完成
        updateOrderStatus(orderId, "completed", transactionId);
        
        // 处理会员变更
        handleMembershipChangePayment(orderId);

        return {
          success: true,
          message: "Membership change completed successfully"
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

Api.addRoute("orders/:_id/cancel", {
  post: {
    authRequired: true,
    action: async function () {
      try {
        const orderId = this.urlParams.id || this.urlParams._id;
        return await cancelOrder(orderId, this.userId);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});
