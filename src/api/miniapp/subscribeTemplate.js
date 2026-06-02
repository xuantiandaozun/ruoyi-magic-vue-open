import request from '@/utils/request'

export function listSubscribeTemplate(query) {
  return request({ url: '/manage/miniSubscribeTemplate/list', method: 'get', params: query })
}

export function getSubscribeTemplate(id) {
  return request({ url: '/manage/miniSubscribeTemplate/' + id, method: 'get' })
}

export function addSubscribeTemplate(data) {
  return request({ url: '/manage/miniSubscribeTemplate', method: 'post', data })
}

export function updateSubscribeTemplate(data) {
  return request({ url: '/manage/miniSubscribeTemplate', method: 'put', data })
}

export function delSubscribeTemplate(ids) {
  return request({ url: '/manage/miniSubscribeTemplate/' + ids, method: 'delete' })
}
