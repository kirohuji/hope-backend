import AlipaySdk from 'alipay-sdk';

class AlipayApi {
  constructor() {
    this.sdk = new AlipaySdk({
      gateway: 'https://openapi.alipay.com/gateway.do', // 正式环境网关
      // gateway: 'https://openapi-sandbox.dl.alipaydev.com/gateway.do', // 沙箱环境网关
      // 设置应用 ID
      appId: '2021005127669569',
      // 设置应用私钥
      privateKey: "MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCeqg9LUxI/XQHQmtvmfzlkecSBLc6hrEC/t+qi8Nq5P7owPHM5JctgKTytdENZFz4gHmQQ/082131ZHfAefANB5hduluD4C4HuwN2RAuO8Hhk7yfdXmw1rCCBe2MxYfBFyVx+OHpP6olgcFmw7Btd7IUmIQ2iPzI/5D7NjUrE6sWiRKrG8dtcnDKcHmWLQep7F3I/UzCcCxDwFYDQIEEHThAQjTifmwl/Aa9OKY1M7DVofVF+HvYZgHjsIKqzhT+ORqig12y5K9ux3i+rS0Ysj2Yv2/xnvSh0cmEZ3e2ljpkZy534TDBSAT0weMzAA1naOK807Up4ulRW5ACLe7oUnAgMBAAECggEAZKIaJz1eIoA8KXI/LTfeUAMHhqNmHpbhTng5QvWe1MY9smB0+HcnQiuFh8JpAPXD+p0r/LfiJzeQEljxtnQToNVuYT8jG1A5LhR3s4Twqp0whgJ4dcErRoqV9XJuUWUHr8zgf8SXOO2FEvOJ2/pf64HWYK3YgPRPELpLniCRtlZQJCeZIlvc5LqpNxMPrCX7QXte8P4mkhzt6TmcxhB6x8ilDvxg9oDi5QC9JpAlafjsM82LDokiQptw2hkWdZv9Hz1GBJcBp6Kwt7CBrhG//auLoOsSIRdFR7aOVDXxwzNZvBmlpA25owh5Vo+OAolySPrGYEjOKmugLuAIRhJUiQKBgQD5mviugZRO7BLblRZ9JtV/jdzslLd/vAZb6tQ0wTsMSJBf2FTqvo2MqrRnbXCW/VNHmof4qugFjEhtMfo4/ixfJfdz/OFAxzYSAGeTxkHzV1VceK0oON+yLd2xxO1tgcbtcnQxa1dhKUTvKsw06kgF8ft7r+RSWl2OKBcwL3yQ3QKBgQCiuqeDZk9kcDbuyz0L3S7zrghxK+K4mvpOAu/tw2RCS7+KNO3FivsjsOTnUqNfwTUg/lL4kL9zN+EjssoMSwil/AA47PPnLfXHgzx/m1+C6XvVGuOkGWcL7ZQCKgnaymHh45zkFOkFWFIg5ZOafOMXvj8EaY6EE0VzYxAilMYr0wKBgQCXK/CpX/l+wyO4sdbo/XgYxMak0n1Ac5Q2X0cenFky20/1fIQRmE8Kfui8K2AhUlP57fGj/X6AvbGv0LEHi4k8JzZznRifrwdkZ7JToaOXybD9TGkzDx8MPxMh828I/6yHauZMeAJ36hLB912uPqZYU3JIOwNBjVFUI5vHpzr+UQKBgDN4aG2WWbxCBg4HuLpc7nHi9Qaew+pyEoPESBFjQP37KY1UanSWHhNO60gDimtKGDzkVGgMmJGf9hUtgtzaitS9XXCj+g2AKwI9D1CpW09z/FgOVjxcUIykS7FXjKBobQde0AwQVRf8tJV1J/ewUr/6y8HghVRfKBN0HPFjLz9DAoGBAI07B1yvRvt0cu8Ek+d+vR3Y/zvLCv4jeVe1h6ei94CRQP9ypq9SWm74L/c/hTVID7dDKS5j0KhmJsjZR/5Y+P8dsJ/stWVXZ+pOekk7611LiXiFF4X+ZpoluB4XtM+37oM/fvabmc7s0XjJdGXm1sF+ZHKGI2akwk/1ceTzoVsV",
      // 设置支付宝公钥
      alipayPublicKey: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzFYw7A15NLeRxeZVOrdI1BYxbXfKd4xKUJ4u9lEzfFSDm8Ds1Nmf4Nc1EB+9vuItcTuH4VEevwIunkD4E4REGSXYX+qht6XVpGHK8hc+fHgXorDKeTiICgmp7bpdP47j/EnHiLF8L9CDZPKKWCTdAV6Pd+zwWQEwj5ak+SFp1Nm98n6Ujp/xzyY6+sO/jy9pALJy8hW2ki3AbvJ0ypy8dFSAhyAkyDqkNKOglJIIiMLC55brTbnLjmCm90efDv1w+hul69R+7gZzgSm4MqQAwvgy7wbAQ0sB4jVkmqGxMjzai3zfv3ef6fubpufEtQIcrk9CazSapKIIrX0L466cswIDAQAB",
      keyType: 'PKCS8'
    });
  }

  // 获取SDK实例
  getSdk() {
    return this.sdk;
  }

  // 创建支付订单
  async createPayment(orderData) {
    try {
      const result = await this.sdk.sdkExec('alipay.trade.app.pay', {
        notifyUrl: 'https://hope.lourd.top/api/v1/alipay/notifyUrl',
        bizContent: {
          out_trade_no: orderData.orderNumber,
          total_amount: orderData.totalAmount,
          subject: orderData.subject,
          product_code: 'QUICK_MSECURITY_PAY',
          // timeout_express: '30m',  // 订单超时时间
          // enable_pay_channels: 'pcredit,moneyFund,debitCardExpress',  // 支付渠道
          // disable_pay_channels: 'creditCard',  // 禁用支付渠道
          // storeId: 'STORE_001',  // 商户门店编号
          // merchantOrderNo: orderData.orderNumber,  // 商户订单号
          // extendParams: {
          //   sysServiceProviderId: '2088511833207846'  // 系统商编号
          // }
        }
      });
      return result;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }
}

export default AlipayApi;