import request from '@/utils/request'

export function listModelPrice(query) {
  return request({ url: '/ai/modelPrice/list', method: 'get', params: query })
}

export function getModelPrice(id) {
  return request({ url: `/ai/modelPrice/${id}`, method: 'get' })
}

export function addModelPrice(data) {
  return request({ url: '/ai/modelPrice', method: 'post', data })
}

export function updateModelPrice(data) {
  return request({ url: '/ai/modelPrice', method: 'put', data })
}

export function delModelPrice(ids) {
  return request({ url: `/ai/modelPrice/${ids}`, method: 'delete' })
}
