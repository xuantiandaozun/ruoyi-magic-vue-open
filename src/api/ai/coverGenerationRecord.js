import request from '@/utils/request'

// 查询列表
export function listCoverGenerationRecords(query) {
  return request({
    url: '/ai/coverGenerationRecord/list',
    method: 'get',
    params: query
  })
}

// 获取详情
export function getCoverGenerationRecord(id) {
  return request({
    url: `/ai/coverGenerationRecord/${id}`,
    method: 'get'
  })
}

// 新增
export function addCoverGenerationRecord(data) {
  return request({
    url: '/ai/coverGenerationRecord',
    method: 'post',
    data
  })
}

// 修改
export function updateCoverGenerationRecord(data) {
  return request({
    url: '/ai/coverGenerationRecord',
    method: 'put',
    data
  })
}

// 删除
export function delCoverGenerationRecord(ids) {
  return request({
    url: `/ai/coverGenerationRecord/${ids}`,
    method: 'delete'
  })
}

// 导出
export function exportCoverGenerationRecord(query) {
  return request({
    url: '/ai/coverGenerationRecord/export',
    method: 'post',
    params: query,
    responseType: 'blob'
  })
}
