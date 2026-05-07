import request from '@/utils/request'

export function listOpenApiKey(query) {
  return request({ url: '/ai/openApiKey/list', method: 'get', params: query })
}

export function getOpenApiKey(id) {
  return request({ url: `/ai/openApiKey/${id}`, method: 'get' })
}

export function addOpenApiKey(data) {
  return request({ url: '/ai/openApiKey', method: 'post', data })
}

export function updateOpenApiKey(data) {
  return request({ url: '/ai/openApiKey', method: 'put', data })
}

export function delOpenApiKey(ids) {
  return request({ url: `/ai/openApiKey/${ids}`, method: 'delete' })
}
