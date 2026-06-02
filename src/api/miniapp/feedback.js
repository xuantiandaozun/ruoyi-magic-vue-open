import request from '@/utils/request'

export function listFeedback(query) {
  return request({ url: '/manage/minifeedback/list', method: 'get', params: query })
}

export function getFeedback(id) {
  return request({ url: '/manage/minifeedback/' + id, method: 'get' })
}

export function replyFeedback(data) {
  return request({ url: '/manage/minifeedback/reply', method: 'put', data })
}

export function delFeedback(ids) {
  return request({ url: '/manage/minifeedback/' + ids, method: 'delete' })
}
