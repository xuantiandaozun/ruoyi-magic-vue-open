import request from '@/utils/request'

// 查询AI插件用户列表
export function listPluginUser(query) {
  return request({
    url: '/ai/pluginUser/list',
    method: 'get',
    params: query
  })
}

// 查询AI插件用户详细
export function getPluginUser(userId) {
  return request({
    url: '/ai/pluginUser/' + userId,
    method: 'get'
  })
}

// 为用户设置专属额度
export function setUserQuota(data) {
  return request({
    url: '/ai/pluginUser/setQuota',
    method: 'post',
    data: data
  })
}

// 删除用户专属额度
export function removeUserQuota(userId) {
  return request({
    url: '/ai/pluginUser/quota/' + userId,
    method: 'delete'
  })
}

// 批量删除用户专属额度
export function batchRemoveUserQuota(userIds) {
  return request({
    url: '/ai/pluginUser/quota/batch/' + userIds,
    method: 'delete'
  })
}
