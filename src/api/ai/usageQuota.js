import request from '@/utils/request'

export function listUsageQuota(query) {
  return request({ url: '/ai/usageQuota/list', method: 'get', params: query })
}

export function getUsageQuota(id) {
  return request({ url: `/ai/usageQuota/${id}`, method: 'get' })
}

export function addUsageQuota(data) {
  return request({ url: '/ai/usageQuota', method: 'post', data })
}

export function updateUsageQuota(data) {
  return request({ url: '/ai/usageQuota', method: 'put', data })
}

export function delUsageQuota(ids) {
  return request({ url: `/ai/usageQuota/${ids}`, method: 'delete' })
}
