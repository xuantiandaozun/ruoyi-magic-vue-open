import request from '@/utils/request'

// 查询存储配置列表
export function listStorageConfig(query) {
  return request({
    url: '/system/storageConfig/list',
    method: 'get',
    params: query
  })
}

// 查询存储配置详细
export function getStorageConfig(configId) {
  return request({
    url: '/system/storageConfig/' + configId,
    method: 'get'
  })
}

// 新增存储配置
export function addStorageConfig(data) {
  return request({
    url: '/system/storageConfig',
    method: 'post',
    data: data
  })
}

// 修改存储配置
export function updateStorageConfig(data) {
  return request({
    url: '/system/storageConfig',
    method: 'put',
    data: data
  })
}

// 删除存储配置
export function delStorageConfig(configId) {
  return request({
    url: '/system/storageConfig/' + configId,
    method: 'delete'
  })
}
