import request from '@/utils/request'

export function listModelRoute(query) {
  return request({ url: '/ai/modelRoute/list', method: 'get', params: query })
}

export function getModelRoute(id) {
  return request({ url: `/ai/modelRoute/${id}`, method: 'get' })
}

export function addModelRoute(data) {
  return request({ url: '/ai/modelRoute', method: 'post', data })
}

export function updateModelRoute(data) {
  return request({ url: '/ai/modelRoute', method: 'put', data })
}

export function delModelRoute(ids) {
  return request({ url: `/ai/modelRoute/${ids}`, method: 'delete' })
}
