import Api from '../../api';
import { RevenueCatCollection, RevenueCatUserCollection } from './collection';
import { handleRevenueCatWebhook } from './service';
import { serverError500 } from '../base/api';
import RevenueCatAPI from './revenuecat-api';

const revenueCatAPI = new RevenueCatAPI();

Api.addRoute('revenueCat/webhook', {
  post: async function () {
    try {
      // Store the webhook data
      await RevenueCatCollection.insert(this.bodyParams);

      // Process the webhook event
      await handleRevenueCatWebhook(this.bodyParams);

      return {
        code: 200,
        message: 'success',
      };
    } catch (e) {
      console.error('RevenueCat webhook error:', e);
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

Api.addRoute('revenueCat/incoming-webhooks/apple-server-to-server-notification', {
  post: function () {
    try {
      // RevenueCatCollection.insert(this.bodyParams);
      return {
        code: 200,
        message: 'success',
      };
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

Api.addRoute('revenueCat/user/identity', {
  get: {
    authRequired: true,
    action: async function () {
      const identity = await revenueCatAPI.getUserIdentity({ project_id: "proj3943cda3", customer_id: this.userId });
      return {
        code: 200,
        message: 'success',
        data: identity,
      };
    }
  }
});

Api.addRoute('revenueCat/entitlements', {
  get: {
    authRequired: true,
    action: async function () {
      const entitlements = await revenueCatAPI.getSubscriptionHistory({ project_id: "proj3943cda3", customer_id: this.userId });
      return entitlements;
    }
  }
});

Api.addRoute('revenueCat/user/invoices', {
  get: {
    authRequired: true,
    action: async function () {
      const invoices = await revenueCatAPI.getInvoices({ project_id: "proj3943cda3", customer_id: this.userId });
      return {
        code: 200,
        message: 'success',
        data: invoices,
      };
    }
  }
});

Api.addRoute('revenueCat/user/purchases', {
  get: {
    authRequired: true,
    action: async function () {
      const purchaseHistory = await revenueCatAPI.getPurchaseHistory({ project_id: "proj3943cda3", customer_id: this.userId });
      return {
        code: 200,
        message: 'success',
        data: purchaseHistory,
      };
    }
  }
});