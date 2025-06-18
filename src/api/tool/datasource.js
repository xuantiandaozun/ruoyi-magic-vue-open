import request from '@/utils/request'

// 查询数据源配置列表
export function listDatasource(query) {
  return request({
    url: '/system/datasource/list',
    method: 'get',
    params: query
  })
}

// 查询数据源配置详细
export function getDatasource(dataSourceId) {
  return request({
    url: '/system/datasource/' + dataSourceId,
    method: 'get'
  })
}

// 新增数据源配置
export function addDatasource(data) {
  return request({
    url: '/system/datasource',
    method: 'post',
    data: data
  })
}

// 修改数据源配置
export function updateDatasource(data) {
  return request({
    url: '/system/datasource',
    method: 'put',
    data: data
  })
}

// 删除数据源配置
export function delDatasource(dataSourceId) {
  return request({
    url: '/system/datasource/' + dataSourceId,
    method: 'delete'
  })
}

// 导出数据源配置
export function exportDatasource(query) {
  return request({
    url: '/system/datasource/export',
    method: 'post',
    params: query
  })
}

// 测试数据源连接
export function testDatasource(data) {
  return request({
    url: '/system/datasource/test',
    method: 'post',
    data: data
  })
}

// 根据数据源名称获取详细信息
export function getDatasourceByName(name) {
  return request({
    url: '/system/datasource/name/' + name,
    method: 'get'
  })
}

// 刷新数据源
export function refreshDatasource() {
  return request({
    url: '/system/datasource/refresh',
    method: 'post'
  })
}
