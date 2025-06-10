import Api from '../../api';
import { serverError500 } from '../base/api';
import { createPayment } from './service';

// 创建支付订单
Api.addRoute('alipay/create-payment', {
  post: async function () {
    try {
      const result = await createPayment(this.bodyParams);
      return {
        code: 200,
        message: 'success',
        data: result,
      };
    } catch (e) {
      console.error('Alipay create payment error:', e);
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

Api.addRoute('alipay/returnUrl', {
  post: async function () {
    try {
      return {
        code: 200,
        message: 'success',
      };
    } catch (e) {
      console.error('Alipay create payment error:', e);
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

Api.addRoute('alipay/notifyUrl', {
  post: async function () {
    try {
      console.log("收到通知了",this.bodyParams);
      return {
        code: 200,
        message: 'success',
      };
    } catch (e) {
      console.error('Alipay create payment error:', e);
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});