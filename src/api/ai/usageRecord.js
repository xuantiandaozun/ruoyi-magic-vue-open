import request from '@/utils/request'

export function listUsageRecord(query) {
  return request({ url: '/ai/usageRecord/list', method: 'get', params: query })
}

export function getUsageRecord(id) {
  return request({ url: `/ai/usageRecord/${id}`, method: 'get' })
}

export function addUsageRecord(data) {
  return request({ url: '/ai/usageRecord', method: 'post', data })
}

export function updateUsageRecord(data) {
  return request({ url: '/ai/usageRecord', method: 'put', data })
}

export function delUsageRecord(ids) {
  return request({ url: `/ai/usageRecord/${ids}`, method: 'delete' })
}
