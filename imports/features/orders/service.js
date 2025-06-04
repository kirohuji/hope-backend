import { OrderCollection, OrderItemCollection, OrderHistoryCollection } from './collection';
import { ProfilesCollection } from 'meteor/socialize:user-profile';
import { MembershipTypeCollection } from '../memberships/collection';
import _ from 'lodash';
import moment from 'moment';
import htmlPdf from 'html-pdf-node';
import Handlebars from 'handlebars';

// 分页查询订单数据
export function pagination(bodyParams) {
  const orders = OrderCollection.find(
    _.pickBy(bodyParams.selector) || {},
    bodyParams.options,
  ).fetch();

  const orderIds = orders.map(order => order._id);
  const userIds = orders.map(order => order.userId);
  const membershipTypeIds = orders.map(order => order.membershipTypeId);

  // 查询订单项
  const orderItems = OrderItemCollection.find({
    orderId: { $in: orderIds },
  }, {
    sort: { createdAt: -1 },
  }).fetch();

  // 查询用户信息
  const users = ProfilesCollection.find({ _id: { $in: userIds } }).fetch();
  const userMap = _.keyBy(users, '_id');

  // 查询会员类型信息
  const membershipTypes = MembershipTypeCollection.find({
    _id: { $in: membershipTypeIds }
  }).fetch();
  const membershipTypeMap = _.keyBy(membershipTypes, '_id');

  // 将订单项按订单ID分组
  const orderItemsMap = _.groupBy(orderItems, 'orderId');

  // 组装数据
  const enhancedData = orders.map(order => {
    const membershipType = membershipTypeMap[order.membershipTypeId];
    return {
      ...order,
      items: orderItemsMap[order._id] || [],
      customer: userMap[order.userId] || null,
      membershipType: membershipType ? {
        name: membershipType.name,
        identifier: membershipType.identifier
      } : null,
      createdAt: moment(order.createdAt).format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: moment(order.updatedAt).format('YYYY-MM-DD HH:mm:ss'),
    };
  });

  return {
    data: enhancedData,
    total: OrderCollection.find(bodyParams.selector).count(),
  };
}

// 获取订单详情
export function getOrderInfo(_id) {
  const order = OrderCollection.findOne({ _id });
  if (!order) {
    throw new Error('订单不存在');
  }

  const user = ProfilesCollection.findOne({ _id: order.userId });
  const membershipType = MembershipTypeCollection.findOne({ _id: order.membershipTypeId });
  const orderItems = OrderItemCollection.find({ orderId: order._id }).fetch();
  const history = OrderHistoryCollection.find({ orderId: order._id }, {
    sort: { createdAt: -1 }
  }).fetch();

  return {
    ...order,
    items: orderItems,
    customer: user,
    membershipType,
    history
  };
}

// 获取用户订单列表
export function getUserOrders(userId) {
  const orders = OrderCollection.find({
    userId,
  }, {
    sort: { createdAt: -1 },
  }).fetch();

  const orderIds = orders.map(order => order._id);
  const orderItems = OrderItemCollection.find({
    orderId: { $in: orderIds },
  }).fetch();

  const orderItemsByOrderId = _.groupBy(orderItems, 'orderId');

  return orders.map(order => ({
    ...order,
    items: orderItemsByOrderId[order._id] || []
  }));
}

// 更新订单状态
export function updateOrderStatus(orderId, status, transactionId = null) {
  const updateData = { 
    status,
    updatedAt: new Date()
  };
  
  if (transactionId) {
    updateData.transactionId = transactionId;
  }
  
  if (status === "completed" && !transactionId) {
    updateData.paidAt = new Date();
  }
  
  const result = OrderCollection.update(orderId, { $set: updateData });
  
  // 记录历史
  OrderHistoryCollection.insert({
    orderId,
    action: status === "completed" ? "paid" : status,
    status,
    description: `订单状态更新为: ${getStatusText(status)}`,
    operatorId: null
  });
  
  return result;
}

// 取消订单
export async function cancelOrder(orderId, userId, reason = "用户取消") {
  const order = OrderCollection.findOne({ _id: orderId });
  
  if (!order) {
    throw new Error('订单不存在');
  }

  if (order.userId !== userId) {
    throw new Error('无权操作此订单');
  }

  if (order.status !== 'pending') {
    throw new Error('只能取消待支付的订单');
  }

  const now = new Date();
  
  // 更新订单状态
  OrderCollection.update(orderId, {
    $set: {
      status: 'cancelled',
      cancelReason: reason,
      cancelledAt: now,
      updatedAt: now
    }
  });

  // 记录订单历史
  OrderHistoryCollection.insert({
    orderId,
    action: 'cancelled',
    status: 'cancelled',
    description: `订单已取消: ${reason}`,
    operatorId: userId
  });

  return {
    success: true,
    message: '订单已取消'
  };
}

// 生成订单 PDF
export async function generateOrderPDF(orderId) {
  const order = OrderCollection.findOne({ _id: orderId });
  if (!order) {
    throw new Error('订单不存在');
  }

  const user = ProfilesCollection.findOne({ _id: order.userId });
  const membershipType = MembershipTypeCollection.findOne({ _id: order.membershipTypeId });
  const orderItems = OrderItemCollection.find({ orderId: order._id }).fetch();

  // 准备模板数据
  const templateData = {
    order: {
      ...order,
      createdAt: moment(order.createdAt).format('YYYY-MM-DD HH:mm:ss'),
      totalAmount: order.totalAmount.toFixed(2),
      currency: order.currency || 'CNY',
      typeText: getOrderTypeText(order.type),
      statusText: getStatusText(order.status),
      billingCycleText: order.billingCycle === 'yearly' ? '年付' : '月付'
    },
    customer: user ? {
      name: user.realName || user.displayName || '未设置',
      email: user.email || '未设置'
    } : null,
    membershipType: membershipType ? {
      name: membershipType.name,
      description: membershipType.description
    } : null,
    items: orderItems.map(item => ({
      name: membershipType ? membershipType.name : '未知项目',
      price: (item.unitPrice || 0).toFixed(2),
      quantity: item.quantity || 1,
      subtotal: ((item.unitPrice || 0) * (item.quantity || 1)).toFixed(2),
      billingCycle: item.billingCycle === 'yearly' ? '年付' : '月付'
    }))
  };

  // HTML 模板
  const template = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #2c3e50; margin: 0; }
        .info-section { margin-bottom: 20px; }
        .info-section h2 { color: #34495e; border-bottom: 2px solid #eee; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; color: #2c3e50; }
        .total { text-align: right; font-size: 1.2em; margin-top: 20px; padding: 10px; background-color: #f8f9fa; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>订单发票</h1>
      </div>

      <div class="info-section">
        <h2>订单信息</h2>
        <p>订单编号：{{order.orderNumber}}</p>
        <p>订单类型：{{order.typeText}}</p>
        <p>下单时间：{{order.createdAt}}</p>
        <p>订单状态：{{order.statusText}}</p>
        <p>付款周期：{{order.billingCycleText}}</p>
      </div>

      {{#if customer}}
      <div class="info-section">
        <h2>客户信息</h2>
        <p>姓名：{{customer.name}}</p>
        <p>邮箱：{{customer.email}}</p>
      </div>
      {{/if}}

      {{#if membershipType}}
      <div class="info-section">
        <h2>订阅信息</h2>
        <p>会员类型：{{membershipType.name}}</p>
        <p>描述：{{membershipType.description}}</p>
      </div>
      {{/if}}

      <div class="info-section">
        <h2>订单项目</h2>
        <table>
          <thead>
            <tr>
              <th>项目</th>
              <th>单价</th>
              <th>数量</th>
              <th>周期</th>
              <th>小计</th>
            </tr>
          </thead>
          <tbody>
            {{#each items}}
            <tr>
              <td>{{name}}</td>
              <td>{{price}}</td>
              <td>{{quantity}}</td>
              <td>{{billingCycle}}</td>
              <td>{{subtotal}}</td>
            </tr>
            {{/each}}
          </tbody>
        </table>
      </div>

      <div class="total">
        订单总额：{{order.totalAmount}} {{order.currency}}
      </div>

      <div class="footer">
        <p>感谢您的订阅！</p>
      </div>
    </body>
    </html>
  `;

  // 编译模板
  const compiledTemplate = Handlebars.compile(template);
  const html = compiledTemplate(templateData);

  // PDF 选项
  const options = {
    format: 'A4',
    margin: {
      top: '20mm',
      right: '20mm',
      bottom: '20mm',
      left: '20mm'
    },
    printBackground: true
  };

  // 生成 PDF
  const file = { content: html };
  const pdfBuffer = await htmlPdf.generatePdf(file, options);

  return pdfBuffer;
}

// 辅助函数
function getStatusText(status) {
  const statusMap = {
    'pending': '待支付',
    'completed': '已完成',
    'failed': '支付失败',
    'cancelled': '已取消',
    'refunded': '已退款'
  };
  return statusMap[status] || status;
}

function getOrderTypeText(type) {
  const typeMap = {
    'subscription': '首次订阅',
    'renewal': '自动续订',
    'upgrade': '升级订阅',
    'downgrade': '降级订阅',
    'cancellation': '取消订阅'
  };
  return typeMap[type] || type;
}
