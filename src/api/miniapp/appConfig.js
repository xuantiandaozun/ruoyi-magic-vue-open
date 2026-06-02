import request from '@/utils/request'

export function listMiniApp(query) {
  return request({ url: '/manage/miniapp/list', method: 'get', params: query })
}

export function listAllMiniApp() {
  return request({ url: '/manage/miniapp/all', method: 'get' })
}

export function getMiniApp(id) {
  return request({ url: '/manage/miniapp/' + id, method: 'get' })
}

export function addMiniApp(data) {
  return request({ url: '/manage/miniapp', method: 'post', data })
}

export function updateMiniApp(data) {
  return request({ url: '/manage/miniapp', method: 'put', data })
}

export function delMiniApp(ids) {
  return request({ url: '/manage/miniapp/' + ids, method: 'delete' })
}
