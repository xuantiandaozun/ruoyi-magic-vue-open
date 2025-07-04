import request from '@/utils/request'

// 查询生成表数据
export function listTable(query) {
  return request({
    url: '/tool/gen/list',
    method: 'get',
    params: query
  })
}

// 查询db数据库列表
export function listDbTable(query) {
  return request({
    url: '/tool/gen/db/list',
    method: 'get',
    params: query
  })
}

// 查询表详细信息
export function getGenTable(tableId) {
  return request({
    url: '/tool/gen/' + tableId,
    method: 'get'
  })
}

// 修改代码生成信息
export function updateGenTable(data) {
  return request({
    url: '/tool/gen',
    method: 'put',
    data: data
  })
}

// 导入表
export function importTable(data) {
  return request({
    url: '/tool/gen/importTable',
    method: 'post',
    params: data
  })
}

// 预览生成代码
export function previewTable(tableId) {
  return request({
    url: '/tool/gen/preview/' + tableId,
    method: 'get'
  })
}

// 删除表数据
export function delTable(tableId) {
  return request({
    url: '/tool/gen/' + tableId,
    method: 'delete'
  })
}

// 生成代码（自定义路径）
export function genCode(tableName) {
  return request({
    url: '/tool/gen/genCode/' + tableName,
    method: 'get'
  })
}

// 同步数据库
export function synchDb(tableName) {
  return request({
    url: '/tool/gen/synchDb/' + tableName,
    method: 'get'
  })
}

// 创建表
export function createTable(data) {
  return request({
    url: '/tool/gen/createTable',
    method: 'post',
    data: data
  })
}

// 智能建表
export function aiDirectTable(data) {
  return request({
    url: '/tool/gen/aiDirectTable',
    method: 'post',
    data: data,
    timeout: 120000  // 设置超时时间为 120 秒
  })
}

// 智能建表异步接口
export function aiDirectTableAsync(data) {
  return request({
    url: '/tool/gen/aiDirectTableAsync',
    method: 'post',
    data: data
  })
}

// 查询异步任务状态
export function getAsyncTaskStatus(taskId) {
  return request({
    url: `/tool/async/task/${taskId}`,
    method: 'get'
  })
}

// 创建导入表
export function createImportTable(data) {
  return request({
    url: '/tool/gen/createImportTable',
    method: 'post',
    data: data
  })
}

// 获取数据源列表
export function listDataSources() {
  return request({
    url: '/tool/gen/dataSources',
    method: 'get'
  })
}

// 根据数据源获取数据库表列表
export function listDbTableByDataSource(dataSourceName, query) {
  return request({
    url: '/tool/gen/db/list/dataSource/' + dataSourceName,
    method: 'get',
    params: query
  })
}

// 根据数据源导入表结构
export function importTableByDataSource(dataSourceName, tables) {
  return request({
    url: '/tool/gen/importTable/dataSource/' + dataSourceName,
    method: 'post',
    params: {
      tables
    }
  })
}

// 执行权限SQL
export function execPermissionSql(tableId) {
  return request({
    url: '/tool/gen/execPermissionSql/' + tableId,
    method: 'post'
  })
}

// AI优化表字段
export function aiOptimizeColumns(tableId) {
  return request({
    url: '/tool/gen/aiOptimizeColumns/' + tableId,
    method: 'post',
    timeout: 120000  // 设置超时时间为 120 秒
  })
}

// AI优化表字段异步接口
export function aiOptimizeColumnsAsync(tableId) {
  return request({
    url: '/tool/gen/aiOptimizeColumnsAsync/' + tableId,
    method: 'post'
  })
}
