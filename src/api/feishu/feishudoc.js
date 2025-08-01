import request from '@/utils/request'

// 查询飞书文档信息列表
export function listFeishudoc(query) {
  return request({
    url: '/feishu/feishudoc/list',
    method: 'get',
    params: query
  })
}

// 查询飞书文档信息详细
export function getFeishudoc(id) {
  return request({
    url: '/feishu/feishudoc/' + id,
    method: 'get'
  })
}

// 新增飞书文档信息
export function addFeishudoc(data) {
  return request({
    url: '/feishu/feishudoc',
    method: 'post',
    data: data
  })
}

// 修改飞书文档信息
export function updateFeishudoc(data) {
  return request({
    url: '/feishu/feishudoc',
    method: 'put',
    data: data
  })
}

// 删除飞书文档信息
export function delFeishudoc(id) {
  return request({
    url: '/feishu/feishudoc/' + id,
    method: 'delete'
  })
}

// 同步飞书文档
export function syncFeishudoc(params) {
  return request({
    url: '/feishu/feishudoc/sync',
    method: 'post',
    params: params
  })
}
