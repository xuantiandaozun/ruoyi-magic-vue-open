import request from '@/utils/request'

export function listModelPolicy(query) {
  return request({ url: '/ai/modelPolicy/list', method: 'get', params: query })
}

export function getModelPolicy(id) {
  return request({ url: `/ai/modelPolicy/${id}`, method: 'get' })
}

export function addModelPolicy(data) {
  return request({ url: '/ai/modelPolicy', method: 'post', data })
}

export function updateModelPolicy(data) {
  return request({ url: '/ai/modelPolicy', method: 'put', data })
}

export function delModelPolicy(ids) {
  return request({ url: `/ai/modelPolicy/${ids}`, method: 'delete' })
}
