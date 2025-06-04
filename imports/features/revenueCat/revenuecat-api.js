import axios from 'axios';

class RevenueCatAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.revenuecat.com/v2';
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer sk_VBMajaWjizFDroAoQMQOpUDCUFAzM`,
        'Content-Type': 'application/json',
      },
    });
  }

  // 获取用户标识信息
  async getUserIdentity({ project_id, customer_id }) {
    try {
      const response = await this.client.get(`projects/${project_id}/customers/${customer_id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user identity:', error);
      throw error;
    }
  }

  // 获取订阅权益状态
  async getSubscriptionStatus({ project_id, customer_id }) {
    try {
      const response = await this.client.get(`projects/${project_id}/customers/${customer_id}/active_entitlements`);
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      throw error;
    }
  }

  // 验证收据和续订状态
  async validateReceipt(appUserId) {
    try {
      const response = await this.client.get(`/subscribers/${appUserId}/receipts`);
      return response.data;
    } catch (error) {
      console.error('Error validating receipt:', error);
      throw error;
    }
  }

  // 获取购买历史和交易记录
  async getSubscriptionHistory({ project_id, customer_id }) {
    try {
      const response = await this.client.get(`projects/${project_id}/customers/${customer_id}/subscriptions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching purchase history:', error);
      throw error;
    }
  }

  // 获取购买历史和交易记录
  async getPurchaseHistory({ project_id, customer_id }) {
    try {
      const response = await this.client.get(`projects/${project_id}/customers/${customer_id}/purchases`);
      return response.data;
    } catch (error) {
      console.error('Error fetching purchase history:', error);
      throw error;
    }
  }

  // 获取发票
  async getInvoices({ project_id, customer_id }) {
    try {
      const response = await this.client.get(`projects/${project_id}/customers/${customer_id}/invoices`);
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }
}

export default RevenueCatAPI; 