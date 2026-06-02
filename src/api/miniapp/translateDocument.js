import request from '@/utils/request'

export function listTranslateDocument(query) {
  return request({ url: '/manage/translateDocument/list', method: 'get', params: query })
}

export function getTranslateDocument(id) {
  return request({ url: '/manage/translateDocument/' + id, method: 'get' })
}
