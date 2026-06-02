import request from '@/utils/request'

export function listComment(query) {
  return request({ url: '/article/comment/list', method: 'get', params: query })
}

export function getComment(id) {
  return request({ url: '/article/comment/' + id, method: 'get' })
}

export function approveComment(ids) {
  return request({ url: '/article/comment/approve/' + ids, method: 'put' })
}

export function rejectComment(ids) {
  return request({ url: '/article/comment/reject/' + ids, method: 'put' })
}

export function delComment(ids) {
  return request({ url: '/article/comment/' + ids, method: 'delete' })
}

export function exportComment(query) {
  return request({ url: '/article/comment/export', method: 'post', params: query, responseType: 'blob' })
}
