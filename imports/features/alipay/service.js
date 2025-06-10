import AlipayApi from './alipay-api';
import { AlipayCollection } from './collection';

const alipay = new AlipayApi();

// 创建支付订单
export async function createPayment(orderData) {
  const { orderNumber, details, notifyUrl, returnUrl } = orderData;
  const { priceChange, newType } = details
  if (!orderNumber || !priceChange || !newType) {
    throw new Error('Missing required parameters');
  }

  const result = await alipay.createPayment({
    orderNumber,
    totalAmount: priceChange,
    subject: newType,
    notifyUrl,
    returnUrl,
  });

  return result;
}

// 查询订单状态
export async function queryOrder(orderNumber) {
  if (!orderNumber) {
    throw new Error('Missing order number');
  }

  const result = await alipay.queryOrder(orderNumber);
  return result;
}

// 关闭订单
export async function closeOrder(orderNumber) {
  if (!orderNumber) {
    throw new Error('Missing order number');
  }

  const result = await alipay.closeOrder(orderNumber);
  return result;
}

// 退款
export async function refund(refundData) {
  const { orderNumber, refundAmount, reason } = refundData;

  if (!orderNumber || !refundAmount) {
    throw new Error('Missing required parameters');
  }

  const result = await alipay.refund({
    orderNumber,
    refundAmount,
    reason,
  });

  return result;
}

// 处理支付回调
export async function handleWebhook(webhookData) {
  try {
    // 验证签名
    const isValid = await alipay.getSdk().checkNotifySign(webhookData);
    if (!isValid) {
      throw new Error('Invalid webhook signature');
    }

    // 存储回调数据
    await AlipayCollection.insert({
      ...webhookData,
      createdAt: new Date(),
    });

    return true;
  } catch (error) {
    console.error('Error handling webhook:', error);
    throw error;
  }
}

// 验证支付状态
export async function verifyPayment(orderNumber) {
  const order = await queryOrder(orderNumber);
  
  if (!order) {
    throw new Error('Order not found');
  }

  // 检查订单状态
  const isPaid = order.tradeStatus === 'TRADE_SUCCESS';
  const isClosed = order.tradeStatus === 'TRADE_CLOSED';

  return {
    isPaid,
    isClosed,
    order,
  };
}

// 获取支付链接
export async function getPaymentUrl(orderData) {
  const result = await createPayment(orderData);
  return result;
}

// 处理退款回调
export async function handleRefundWebhook(webhookData) {
  try {
    // 验证签名
    const isValid = await alipay.getSdk().checkNotifySign(webhookData);
    if (!isValid) {
      throw new Error('Invalid refund webhook signature');
    }

    // 存储退款回调数据
    await AlipayCollection.insert({
      ...webhookData,
      type: 'refund',
      createdAt: new Date(),
    });

    return true;
  } catch (error) {
    console.error('Error handling refund webhook:', error);
    throw error;
  }
}
