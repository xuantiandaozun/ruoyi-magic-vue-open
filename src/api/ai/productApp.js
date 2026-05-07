import request from '@/utils/request'

export function listProductApp(query) {
  return request({ url: '/ai/productApp/list', method: 'get', params: query })
}

export function getProductApp(id) {
  return request({ url: `/ai/productApp/${id}`, method: 'get' })
}

export function addProductApp(data) {
  return request({ url: '/ai/productApp', method: 'post', data })
}

export function updateProductApp(data) {
  return request({ url: '/ai/productApp', method: 'put', data })
}

export function delProductApp(ids) {
  return request({ url: `/ai/productApp/${ids}`, method: 'delete' })
}
