import { MembershipCollection } from '../memberships/collection';
import { OrderCollection,OrderItemCollection } from '../orders/collection';
import { RevenueCatUserCollection } from './collection';

// Handle different types of RevenueCat webhook events
export const handleRevenueCatWebhook = async (webhookData) => {
  const { event } = webhookData;
  if(event){
    switch (event.type) {
      // case 'INITIAL_PURCHASE':
      //   return handleInitialPurchase(webhookData);
      case 'RENEWAL':
        return handleRenewal(webhookData);
      // case 'NON_RENEWING_PURCHASE':
      //   return handleNonRenewingPurchase(webhookData);
      case 'CANCELLATION':
        return handleCancellation(webhookData);
      // case 'BILLING_ISSUE':
      //   return handleBillingIssue(webhookData);
      // case 'SUBSCRIPTION_PAUSED':
      //   return handleSubscriptionPaused(webhookData);
      // case 'TRANSFER':
      //   return handleTransfer(webhookData);
      default:
        console.log(`Unhandled RevenueCat event type: ${event.type}`);
        return true;
    }
  }
};

// Handle initial purchase event
const handleInitialPurchase = async (webhookData) => {
  const { event } = webhookData;
  const { user_id, product_id, purchase_date } = event;
  
  try {
    // Create or update membership
    await MembershipCollection.upsert(
      { userId: user_id },
      {
        $set: {
          type: product_id,
          status: 'active',
          startDate: purchase_date,
          endDate: calculateEndDate(purchase_date, product_id),
          paymentMethod: 'revenueCat',
          autoRenew: true,
          updatedAt: new Date()
        }
      }
    );
    
    return true;
  } catch (error) {
    console.error('Error handling initial purchase:', error);
    throw error;
  }
};

// Handle renewal event
const handleRenewal = async (webhookData) => {
  const { event } = webhookData;
  const { transaction_id, product_id, app_user_id } = event;
  const user = Meteor.users.findOne({ _id: app_user_id });
  if (!user) {
    throw new Error('User not found');
  }
  const userId = user.userId;
  try {
    // 获取当前会员信息
    const currentMembership = await MembershipCollection.findOne({ userId: userId });
    if (!currentMembership) {
      throw new Error('No active membership found for renewal');
    }
    const isYearly = product_id.includes('yearly');
    let startDate, endDate;
    if (currentMembership) {
      // 如果用户已有会员，新会员从当前会员到期后开始
      startDate = new Date(currentMembership.endDate);
      endDate = isYearly 
        ? new Date(new Date(startDate).setFullYear(startDate.getFullYear() + 1))
        : new Date(new Date(startDate).setMonth(startDate.getMonth() + 1));
    } else {
      // 如果用户没有会员，新会员立即开始
      startDate = new Date();
      endDate = isYearly 
        ? new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        : new Date(new Date().setMonth(new Date().getMonth() + 1));
    }
    // 创建续费订单
    const orderData = {
      userId: userId,
      status: "completed", // 直接设置为已完成，因为已经支付成功
      type: "membership_renewal",
      totalAmount: currentMembership.price,
      membershipType: currentMembership.type,
      membershipId: currentMembership.membershipTypeId,
      previousMembershipId: currentMembership._id,
      previousMembershipType: currentMembership.type,
      paymentMethod: "revenueCat",
      isYearly: currentMembership.isYearly || false,
      orderNumber: `R${new Date().getTime()}`,
      createdAt: new Date(),
      transactionId: transaction_id,
      // 新会员的开始和结束时间
      newMembershipStartDate: startDate,
      newMembershipEndDate: endDate
    };
    
    const orderId = await OrderCollection.insert(orderData);
    
    // 创建订单项
    await OrderItemCollection.insert({
      orderId,
      objectType: "memberships_types",
      linkedObjectId: currentMembership.membershipTypeId,
      price: currentMembership.price,
      quantity: 1,
      isYearly: currentMembership.isYearly || false,
      createdAt: new Date(),
      createdBy: user._id
    });

    updateOrderStatus(orderId, "completed", transaction_id);

    // 处理会员变更
    await handleMembershipChangePayment(orderId);
    
    return true;
  } catch (error) {
    console.error('Error handling renewal:', error);
    throw error;
  }
};

// Handle non-renewing purchase event
const handleNonRenewingPurchase = async (webhookData) => {
  const { event } = webhookData;
  const { user_id, product_id, purchase_date } = event;
  
  try {
    await MembershipCollection.update(
      { userId: user_id },
      {
        $set: {
          type: product_id,
          status: 'active',
          startDate: purchase_date,
          endDate: calculateEndDate(purchase_date, product_id),
          autoRenew: false,
          updatedAt: new Date()
        }
      }
    );
    
    return true;
  } catch (error) {
    console.error('Error handling non-renewing purchase:', error);
    throw error;
  }
};

// Handle cancellation event
const handleCancellation = async (webhookData) => {
  const { event } = webhookData;
  const { app_user_id } = event;
  const user = RevenueCatUserCollection.findOne({ appUserId: app_user_id });
  if (!user) {
    throw new Error('User not found');
  }
  const userId = user.userId;
  
  try {
    await MembershipCollection.update(
      { userId: userId },
      {
        $set: {
          status: 'cancelled',
          autoRenew: false,
          updatedAt: new Date()
        }
      }
    );
    // updateOrderStatus(orderId, "cancelled");
    
    return true;
  } catch (error) {
    console.error('Error handling cancellation:', error);
    throw error;
  }
};

// Handle billing issue event
const handleBillingIssue = async (webhookData) => {
  const { event } = webhookData;
  const { user_id } = event;
  
  try {
    await MembershipCollection.update(
      { userId: user_id },
      {
        $set: {
          status: 'billing_issue',
          updatedAt: new Date()
        }
      }
    );
    
    return true;
  } catch (error) {
    console.error('Error handling billing issue:', error);
    throw error;
  }
};

// Handle subscription paused event
const handleSubscriptionPaused = async (webhookData) => {
  const { event } = webhookData;
  const { user_id } = event;
  
  try {
    await MembershipCollection.update(
      { userId: user_id },
      {
        $set: {
          status: 'paused',
          updatedAt: new Date()
        }
      }
    );
    
    return true;
  } catch (error) {
    console.error('Error handling subscription paused:', error);
    throw error;
  }
};

// Handle transfer event
const handleTransfer = async (webhookData) => {
  const { event } = webhookData;
  const { user_id, new_user_id } = event;
  
  try {
    await MembershipCollection.update(
      { userId: user_id },
      {
        $set: {
          userId: new_user_id,
          updatedAt: new Date()
        }
      }
    );
    
    return true;
  } catch (error) {
    console.error('Error handling transfer:', error);
    throw error;
  }
};

// Helper function to calculate end date based on product type
const calculateEndDate = (startDate, productId) => {
  const date = new Date(startDate);
  
  // Add logic here to determine subscription period based on productId
  // This is a simple example - you should adjust based on your product IDs
  if (productId.includes('yearly')) {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setMonth(date.getMonth() + 1);
  }
  
  return date.toISOString();
};
