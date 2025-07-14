import request from '@/utils/request'

// 查询RDS实例管理列表
export function listRdsInstance(query) {
  return request({
    url: '/system/rdsInstance/list',
    method: 'get',
    params: query
  })
}

// 查询RDS实例管理详细
export function getRdsInstance(id) {
  return request({
    url: '/system/rdsInstance/' + id,
    method: 'get'
  })
}

// 新增RDS实例管理
export function addRdsInstance(data) {
  return request({
    url: '/system/rdsInstance',
    method: 'post',
    data: data
  })
}

// 修改RDS实例管理
export function updateRdsInstance(data) {
  return request({
    url: '/system/rdsInstance',
    method: 'put',
    data: data
  })
}

// 删除RDS实例管理
export function delRdsInstance(id) {
  return request({
    url: '/system/rdsInstance/' + id,
    method: 'delete'
  })
}
