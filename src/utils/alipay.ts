import axios from 'axios'
import { ElMessage } from 'element-plus'

export const useAlipay = () => {
  // 获取支付宝支付二维码
  const getQrCode = async (orderInfo) => {
    try {
      const response = await axios.post('/api/alipay/create', orderInfo)
      return response.data.qr_code
    } catch (error) {
      ElMessage.error('获取支付宝支付码失败')
      throw error
    }
  }
  
  // 检查支付宝支付状态
  const checkPaymentStatus = async (orderId) => {
    try {
      const response = await axios.get(`/api/alipay/status?out_trade_no=${orderId}`)
      return response.data.paid
    } catch (error) {
      console.error('检查支付宝支付状态失败:', error)
      return false
    }
  }

  return {
    getQrCode,
    checkPaymentStatus
  }
}