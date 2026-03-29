import axios from 'axios'

export default {
  // 初始化微信支付
  async initPayment(orderInfo) {
    try {
      // 1. 从后端获取支付参数
      const response = await axios.post('/api/wxpay/jsapi', orderInfo)
      
      // 2. 调用微信支付接口
      return new Promise((resolve, reject) => {
        if (typeof WeixinJSBridge === 'undefined') {
          reject(new Error('请在微信中打开页面'))
          return
        }
        
        WeixinJSBridge.invoke(
          'getBrandWCPayRequest',
          {
            appId: response.data.appId,
            timeStamp: response.data.timeStamp,
            nonceStr: response.data.nonceStr,
            package: response.data.package,
            signType: response.data.signType,
            paySign: response.data.paySign
          },
          (res) => {
            if (res.err_msg === 'get_brand_wcpay_request:ok') {
              resolve(true)
            } else {
              reject(new Error(res.err_msg || '支付失败'))
            }
          }
        )
      })
    } catch (error) {
      throw error
    }
  }
}