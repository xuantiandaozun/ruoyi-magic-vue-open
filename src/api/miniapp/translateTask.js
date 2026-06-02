import request from '@/utils/request'

export function listTranslateTask(query) {
  return request({ url: '/manage/translateTask/list', method: 'get', params: query })
}

export function getTranslateTask(id) {
  return request({ url: '/manage/translateTask/' + id, method: 'get' })
}
