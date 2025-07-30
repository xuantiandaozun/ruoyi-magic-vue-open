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

// 同步阿里云RDS实例
export function syncAliyunRdsInstances() {
  return request({
    url: '/system/rdsInstance/syncAliyun',
    method: 'post'
  })
}

// 获取RDS实例连接信息
export function getRdsInstanceNetInfo(dbInstanceId) {
  return request({
    url: '/system/rdsInstance/netInfo/' + dbInstanceId,
    method: 'get'
  })
}

// 获取RDS实例白名单信息
export function getRdsInstanceIPArrayList(dbInstanceId) {
  return request({
    url: '/system/rdsInstance/ipArrayList/' + dbInstanceId,
    method: 'get'
  })
}

// 修改RDS实例白名单
export function modifyRdsInstanceSecurityIps(dbInstanceId, data) {
  return request({
    url: '/system/rdsInstance/modifySecurityIps/' + dbInstanceId,
    method: 'put',
    data: data
  })
}

// 批量更新所有RDS实例的客户端白名单
export function updateAllRdsClientWhitelist() {
  return request({
    url: '/system/rdsInstance/updateClientWhitelist',
    method: 'post'
  })
}
