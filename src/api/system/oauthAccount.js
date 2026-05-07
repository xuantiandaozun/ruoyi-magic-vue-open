import request from '@/utils/request'

export function listOauthAccount(query) {
  return request({ url: '/system/oauthAccount/list', method: 'get', params: query })
}

export function getOauthAccount(id) {
  return request({ url: `/system/oauthAccount/${id}`, method: 'get' })
}

export function addOauthAccount(data) {
  return request({ url: '/system/oauthAccount', method: 'post', data })
}

export function updateOauthAccount(data) {
  return request({ url: '/system/oauthAccount', method: 'put', data })
}

export function delOauthAccount(ids) {
  return request({ url: `/system/oauthAccount/${ids}`, method: 'delete' })
}
