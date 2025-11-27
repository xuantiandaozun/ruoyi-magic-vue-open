import request from '@/utils/request'

// 查询飞书用户信息列表
export function listFeishuUsers(query) {
  return request({
    url: '/feishu/users/list',
    method: 'get',
    params: query
  })
}

// 查询飞书用户信息详细
export function getFeishuUsers(id) {
  return request({
    url: '/feishu/users/' + id,
    method: 'get'
  })
}

// 根据open_id查询飞书用户
export function getFeishuUsersByOpenId(openId) {
  return request({
    url: '/feishu/users/openId/' + openId,
    method: 'get'
  })
}

// 根据手机号查询飞书用户
export function getFeishuUsersByMobile(mobile) {
  return request({
    url: '/feishu/users/mobile/' + mobile,
    method: 'get'
  })
}

// 新增飞书用户信息
export function addFeishuUsers(data) {
  return request({
    url: '/feishu/users',
    method: 'post',
    data: data
  })
}

// 修改飞书用户信息
export function updateFeishuUsers(data) {
  return request({
    url: '/feishu/users',
    method: 'put',
    data: data
  })
}

// 删除飞书用户信息
export function delFeishuUsers(id) {
  return request({
    url: '/feishu/users/' + id,
    method: 'delete'
  })
}
