import request from '@/utils/request'

// 查询密钥管理列表
export function listSecretKey(query) {
  return request({
    url: '/system/secretKey/list',
    method: 'get',
    params: query
  })
}

// 查询密钥管理详细
export function getSecretKey(id) {
  return request({
    url: '/system/secretKey/' + id,
    method: 'get'
  })
}

// 新增密钥管理
export function addSecretKey(data) {
  return request({
    url: '/system/secretKey',
    method: 'post',
    data: data
  })
}

// 修改密钥管理
export function updateSecretKey(data) {
  return request({
    url: '/system/secretKey',
    method: 'put',
    data: data
  })
}

// 删除密钥管理
export function delSecretKey(id) {
  return request({
    url: '/system/secretKey/' + id,
    method: 'delete'
  })
}
