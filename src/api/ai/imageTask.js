import request from '@/utils/request'

export function listImageTask(query) {
  return request({ url: '/ai/imageTask/list', method: 'get', params: query })
}

export function getImageTask(id) {
  return request({ url: `/ai/imageTask/${id}`, method: 'get' })
}

export function addImageTask(data) {
  return request({ url: '/ai/imageTask', method: 'post', data })
}

export function updateImageTask(data) {
  return request({ url: '/ai/imageTask', method: 'put', data })
}

export function delImageTask(ids) {
  return request({ url: `/ai/imageTask/${ids}`, method: 'delete' })
}
