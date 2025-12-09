import request from '@/utils/request'

// 查询自媒体素材列表
export function listSocialMediaAsset(query) {
  return request({
    url: '/article/social-media-asset/list',
    method: 'get',
    params: query
  })
}

// 查询自媒体素材详细
export function getSocialMediaAsset(id) {
  return request({
    url: '/article/social-media-asset/' + id,
    method: 'get'
  })
}

// 新增自媒体素材
export function addSocialMediaAsset(data) {
  return request({
    url: '/article/social-media-asset',
    method: 'post',
    data: data
  })
}

// 修改自媒体素材
export function updateSocialMediaAsset(data) {
  return request({
    url: '/article/social-media-asset',
    method: 'put',
    data: data
  })
}

// 删除自媒体素材
export function delSocialMediaAsset(id) {
  return request({
    url: '/article/social-media-asset/' + id,
    method: 'delete'
  })
}

// 修改素材状态
export function updateSocialMediaAssetStatus(id, data) {
  return request({
    url: '/article/social-media-asset/' + id + '/status',
    method: 'put',
    data: data
  })
}

// 更新素材指标快照
export function updateSocialMediaAssetMetrics(id, data) {
  return request({
    url: '/article/social-media-asset/' + id + '/metrics',
    method: 'put',
    data: data
  })
}

// 导出自媒体素材
export function exportSocialMediaAsset(query) {
  return request({
    url: '/article/social-media-asset/export',
    method: 'post',
    params: query,
    responseType: 'blob'
  })
}
