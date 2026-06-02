import request from '@/utils/request'

export function listLikeRecord(query) {
  return request({ url: '/article/likeRecord/list', method: 'get', params: query })
}

export function getLikeRecord(id) {
  return request({ url: '/article/likeRecord/' + id, method: 'get' })
}

export function delLikeRecord(ids) {
  return request({ url: '/article/likeRecord/' + ids, method: 'delete' })
}

export function exportLikeRecord(query) {
  return request({ url: '/article/likeRecord/export', method: 'post', params: query, responseType: 'blob' })
}
