import request from '@/utils/request'

export function listMiniUser(query) {
  return request({ url: '/manage/miniuser/list', method: 'get', params: query })
}

export function getMiniUser(id) {
  return request({ url: '/manage/miniuser/' + id, method: 'get' })
}

export function changeMiniUserStatus(data) {
  return request({ url: '/manage/miniuser/changeStatus', method: 'put', data })
}

export function delMiniUser(ids) {
  return request({ url: '/manage/miniuser/' + ids, method: 'delete' })
}
