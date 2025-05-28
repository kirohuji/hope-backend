import { OrderCollection, OrderItemCollection } from './collection';
import { ProfilesCollection } from 'meteor/socialize:user-profile';
import _ from 'lodash';
import moment from 'moment';
import { MembershipTypeCollection, MembershipCollection } from '../memberships/collection';
import htmlPdf from 'html-pdf-node';
import Handlebars from 'handlebars';
import { OrderHistoryCollection } from './collection';

// 分页查询数据（包含会员信息）
export function paginationWithMembership(bodyParams) {
  let curror = OrderCollection.find(
    _.pickBy(bodyParams.selector) || {},
    bodyParams.options,
  );
  const data = curror.fetch();
  const createdByIds = _.map(data, 'userId');
  const users = ProfilesCollection.find({ _id: { $in: createdByIds } }).fetch();
  const userMap = _.keyBy(users, '_id');
  const enhancedData = data.map(item => {
    const user = userMap[item.userId];
    let membership = {};
    const orderItems = OrderItemCollection.find({
      orderId: item._id,
    }).map(orderItem => {
      if (orderItem.objectType === 'memberships_types') {
        membership = MembershipTypeCollection.findOne({
          _id: orderItem.linkedObjectId,
        });
      }
      return {
        ...orderItem,
        linkedObject: membership,
      };
    });
    return {
      ...item,
      items: orderItems,
      customer: user,
    };
  });
  return {
    data: enhancedData,
    total: OrderCollection.find(bodyParams.selector).count(),
  };
}

// 分页查询订单和订单项
export function pagination(bodyParams) {
  // 查询订单
  const orders = OrderCollection.find(
    _.pickBy(bodyParams.selector) || {},
    bodyParams.options,
  ).fetch();

  // 获取订单ID列表和用户ID列表
  const orderIds = orders.map(order => order._id);
  const userIds = orders.map(order => order.userId);

  // 查询订单项
  const orderItems = OrderItemCollection.find({
    orderId: { $in: orderIds },
  }, {
    sort: {
      createdAt: -1,
    },
  }).fetch();

  // 查询用户信息
  const users = ProfilesCollection.find({ _id: { $in: userIds } }).fetch();
  const userMap = _.keyBy(users, '_id');

  // 获取所有会员类型ID
  const membershipTypeIds = orderItems
    .filter(item => item.objectType === 'memberships_types')
    .map(item => item.linkedObjectId);

  // 查询会员类型信息
  const membershipTypes = MembershipTypeCollection.find({
    _id: { $in: membershipTypeIds }
  }).fetch();
  const membershipTypeMap = _.keyBy(membershipTypes, '_id');

  // 将订单项按订单ID分组，并添加关联对象信息
  const orderItemsMap = _.groupBy(orderItems, 'orderId');
  const enhancedOrderItemsMap = {};
  
  Object.keys(orderItemsMap).forEach(orderId => {
    enhancedOrderItemsMap[orderId] = orderItemsMap[orderId].map(item => {
      let linkedObject = null;
      if (item.objectType === 'memberships_types') {
        linkedObject = membershipTypeMap[item.linkedObjectId] || null;
      }
      return {
        ...item,
        linkedObject
      };
    });
  });

  // 组装数据
  const enhancedData = orders.map(order => ({
    ...order,
    items: enhancedOrderItemsMap[order._id] || [],
    customer: userMap[order.userId] || null,
    createdAt: moment(order.createdAt).format('YYYY-MM-DD HH:mm:ss'),
    updatedAt: moment(order.updatedAt).format('YYYY-MM-DD HH:mm:ss'),
  }));

  return {
    data: enhancedData,
    total: OrderCollection.find(bodyParams.selector).count(),
  };
}

export function info(_id) {
  const order = OrderCollection.findOne({
    _id,
  });
  const user = ProfilesCollection.findOne({ _id: order.userId });
  let membership = {};
  const orderItems = OrderItemCollection.find({
    orderId: order._id,
  }).map(orderItem => {
    if (orderItem.objectType === 'memberships_types') {
      membership = MembershipTypeCollection.findOne({
        _id: orderItem.linkedObjectId,
      });
    }
    return {
      ...orderItem,
      linkedObject: membership,
    };
  });
  return {
    ...order,
    items: orderItems,
    customer: user,
    delivery: {},
    shippingAddress: {},
    payment: {},
    history: {
      timeline: [],
    },
  };
}

export function getUserOrders(userId) {
  const orders = OrderCollection.find({
    userId,
  }).fetch();

  const orderIds = orders.map(order => order._id);
  const orderItems = OrderItemCollection.find({
    orderId: { $in: orderIds },
  }, {
    sort: {
      createdAt: -1,
    },
  }).fetch();

  // 将订单项按 orderId 分组
  const orderItemsByOrderId = _.groupBy(orderItems, 'orderId');

  // 将订单项添加到对应的订单中
  return orders.map(order => ({
    ...order,
    items: orderItemsByOrderId[order._id] || []
  }));
}

// 创建新订单（包含账单功能）
export function createOrder(orderData) {
  return OrderCollection.insert(orderData);
}

// 更新订单状态
export function updateOrderStatus(orderId, status, transactionId = null) {
  const updateData = { status };
  if (transactionId) {
    updateData.transactionId = transactionId;
  }
  return OrderCollection.update(orderId, { $set: updateData });
}

// 处理会员变更支付成功
export async function handleMembershipChangePayment(orderId) {
  const order = OrderCollection.findOne(orderId);
  if (!order || order.status !== "completed") {
    throw new Error("Invalid order or order not completed");
  }

  // 获取订单项中的会员类型信息
  const orderItem = OrderItemCollection.findOne({
    orderId,
    objectType: "memberships_types"
  });

  if (!orderItem) {
    throw new Error("Order item not found");
  }

  // 如果用户已有会员信息，则更新
  if (order.previousMembershipId) {
    await MembershipCollection.update(
      { _id: order.previousMembershipId },
      {
        $set: {
          type: order.membershipType,
          status: "active",
          paymentMethod: order.paymentMethod,
          orderId: order.transactionId,
          previousType: order.previousMembershipType,
          changedAt: new Date(),
          membershipTypeId: order.membershipId,
          startDate: new Date().toISOString(),
          endDate: order.isYearly ?
            new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString() :
            new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
        },
      }
    );
  } else {
    // 如果用户没有会员信息，则创建新的会员记录
    await MembershipCollection.insert({
      type: order.membershipType,
      status: "active",
      paymentMethod: order.paymentMethod,
      orderId: order.transactionId,
      previousType: order.previousMembershipType,
      changedAt: new Date(),
      createdBy: order.userId,
      createdAt: new Date(),
      membershipTypeId: order.membershipId,
      startDate: new Date().toISOString(),
      endDate: order.isYearly ?
        new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString() :
        new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
      price: orderItem.price,
      currency: "CNY",
      autoRenew: false,
    });
  }

  return true;
}

// 生成订单号
function generateOrderNumber() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `M${year}${month}${day}${random}`;
}

// 处理会员等级切换
export async function handleMembershipChange(userId, planId, isYearly) {
  // 获取会员类型信息
  const membershipType = MembershipTypeCollection.findOne({ _id: planId });
  if (!membershipType) {
    throw new Error("Invalid membership plan");
  }

  // 获取用户当前会员信息
  const currentMembership = MembershipCollection.findOne({ createdBy: userId });
  
  // 获取用户信息
  const user = ProfilesCollection.findOne({ _id: userId });
  if (!user) {
    throw new Error("User not found");
  }
  
  // 计算价格
  const price = isYearly ? parseFloat(membershipType.price) * 12 : parseFloat(membershipType.price);
  
  // 创建订单
  const orderData = {
    userId,
    status: "pending",
    type: "membership_change",
    totalAmount: price,
    membershipType: membershipType.value,
    membershipId: membershipType._id,
    previousMembershipId: currentMembership?._id,
    previousMembershipType: currentMembership?.type || "none",
    paymentMethod: "pending",
    isYearly: isYearly || false,
    orderNumber: generateOrderNumber(),
    createdAt: new Date(),
    scope: user.scope || '', // 添加用户 scope
    createdBy: userId // 添加创建者
  };
  
  const orderId = OrderCollection.insert(orderData);
  
  // 创建订单项
  OrderItemCollection.insert({
    orderId,
    objectType: "memberships_types",
    linkedObjectId: planId,
    price,
    quantity: 1,
    isYearly: isYearly || false,
    createdAt: new Date(),
    scope: user.scope || '', // 添加用户 scope
    createdBy: userId // 添加创建者
  });

  return {
    orderId,
    orderNumber: orderData.orderNumber,
    price,
    membershipType: membershipType.value,
    previousMembershipType: currentMembership?.type || "none",
    isYearly: isYearly || false,
    scope: user.scope || '' // 返回 scope 信息
  };
}

// 注册状态转换的辅助函数
Handlebars.registerHelper('formatStatus', function (status) {
  const statusMap = {
    'completed': '已完成',
    'pending': '处理中',
    'cancelled': '已取消',
    'refunded': '已退款',
    'failed': '支付失败'
  };
  return statusMap[status] || status;
});

// 生成订单 PDF
export async function generateOrderPDF(orderId) {
  const order = OrderCollection.findOne({ _id: orderId });
  if (!order) {
    throw new Error('订单不存在');
  }

  const user = ProfilesCollection.findOne({ _id: order.userId });
  const orderItems = OrderItemCollection.find({ orderId: order._id }).fetch();

  // 准备模板数据
  const templateData = {
    order: {
      ...order,
      createdAt: moment(order.createdAt).format('YYYY-MM-DD HH:mm:ss'),
      totalAmount: order.totalAmount.toFixed(2),
      currency: order.currency || 'CNY',
      paymentPeriod: order.isYearly ? '年付' : '月付'
    },
    customer: user ? {
      name: user.realName || user.displayName || '未设置',
      email: user.email || '未设置'
    } : null,
    items: orderItems.map(item => {
      const membership = MembershipTypeCollection.findOne({ _id: item.linkedObjectId });
      return {
        name: membership ? membership.label : '未知项目',
        price: (item.price || 0).toFixed(2),
        quantity: item.quantity || 1,
        subtotal: ((item.price || 0) * (item.quantity || 1)).toFixed(2),
        isYearly: item.isYearly ? '年付' : '月付'
      };
    })
  };

  // HTML 模板
  const template = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 40px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #2c3e50;
          margin: 0;
        }
        .info-section {
          margin-bottom: 20px;
        }
        .info-section h2 {
          color: #34495e;
          border-bottom: 2px solid #eee;
          padding-bottom: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #f8f9fa;
          color: #2c3e50;
        }
        .total {
          text-align: right;
          font-size: 1.2em;
          margin-top: 20px;
          padding: 10px;
          background-color: #f8f9fa;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          color: #666;
        }
        .status {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.9em;
        }
        .status-completed {
          background-color: #d4edda;
          color: #155724;
        }
        .status-pending {
          background-color: #fff3cd;
          color: #856404;
        }
        .status-cancelled {
          background-color: #f8d7da;
          color: #721c24;
        }
        .status-refunded {
          background-color: #e2e3e5;
          color: #383d41;
        }
        .status-failed {
          background-color: #f8d7da;
          color: #721c24;
        }
        .payment-period {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.9em;
          background-color: #e3f2fd;
          color: #0d47a1;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>订单发票</h1>
      </div>

      <div class="info-section">
        <h2>订单信息</h2>
        <p>订单编号：{{order.orderNumber}}</p>
        <p>下单时间：{{order.createdAt}}</p>
        <p>订单状态：<span class="status status-{{order.status}}">{{formatStatus order.status}}</span></p>
        <p>付款周期：<span class="payment-period">{{order.paymentPeriod}}</span></p>
      </div>

      {{#if customer}}
      <div class="info-section">
        <h2>客户信息</h2>
        <p>姓名：{{customer.name}}</p>
        <p>邮箱：{{customer.email}}</p>
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
              <td>{{isYearly}}</td>
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
        <p>感谢您的购买！</p>
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

// 取消订单
export async function cancelOrder(orderId, userId) {
  const order = OrderCollection.findOne({ _id: orderId });
  
  if (!order) {
    throw new Error('订单不存在');
  }

  // 验证订单所有者
  if (order.userId !== userId) {
    throw new Error('无权操作此订单');
  }

  // 只能取消待支付的订单
  if (order.status !== 'pending') {
    throw new Error('只能取消待支付的订单');
  }

  // 更新订单状态
  OrderCollection.update(
    { _id: orderId },
    {
      $set: {
        status: 'cancelled',
        updatedAt: new Date()
      }
    }
  );

  // 记录订单历史
  OrderHistoryCollection.insert({
    orderId,
    status: 'cancelled',
    message: '用户取消订单',
    createdAt: new Date(),
    createdBy: userId
  });

  return {
    success: true,
    message: '订单已取消'
  };
}
