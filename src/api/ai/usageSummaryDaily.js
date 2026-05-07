import request from '@/utils/request'

export function listUsageSummaryDaily(query) {
  return request({ url: '/ai/usageSummaryDaily/list', method: 'get', params: query })
}

export function getUsageSummaryDaily(id) {
  return request({ url: `/ai/usageSummaryDaily/${id}`, method: 'get' })
}

export function addUsageSummaryDaily(data) {
  return request({ url: '/ai/usageSummaryDaily', method: 'post', data })
}

export function updateUsageSummaryDaily(data) {
  return request({ url: '/ai/usageSummaryDaily', method: 'put', data })
}

export function delUsageSummaryDaily(ids) {
  return request({ url: `/ai/usageSummaryDaily/${ids}`, method: 'delete' })
}
