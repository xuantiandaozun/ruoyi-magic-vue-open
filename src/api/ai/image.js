import request from '@/utils/request'

// 生成AI图片
export function generateImage(data) {
  return request({
    url: '/ai/image/generate',
    method: 'post',
    data: data
  })
}

// 获取支持的模型列表
export function getSupportedModels() {
  return request({
    url: '/ai/image/models',
    method: 'get'
  })
}

// 获取支持的图片尺寸列表
export function getSupportedSizes() {
  return request({
    url: '/ai/image/sizes',
    method: 'get'
  })
}