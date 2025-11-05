import request from '@/utils/request'

// 查询列表
export function listBlogProductionRecords(query) {
  return request({
    url: '/ai/blogProductionRecord/list',
    method: 'get',
    params: query
  })
}

// 获取详情
export function getBlogProductionRecord(id) {
  return request({
    url: `/ai/blogProductionRecord/${id}`,
    method: 'get'
  })
}

// 新增
export function addBlogProductionRecord(data) {
  return request({
    url: '/ai/blogProductionRecord',
    method: 'post',
    data
  })
}

// 修改
export function updateBlogProductionRecord(data) {
  return request({
    url: '/ai/blogProductionRecord',
    method: 'put',
    data
  })
}

// 删除
export function delBlogProductionRecord(ids) {
  return request({
    url: `/ai/blogProductionRecord/${ids}`,
    method: 'delete'
  })
}

// 导出
export function exportBlogProductionRecord(query) {
  return request({
    url: '/ai/blogProductionRecord/export',
    method: 'post',
    params: query,
    responseType: 'blob'
  })
}
