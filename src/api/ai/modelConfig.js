import request from '@/utils/request'

// 查询列表
export function listModelConfigs(query) {
  return request({
    url: '/ai/modelConfig/list',
    method: 'get',
    params: query
  })
}

// 获取详情
export function getModelConfig(id) {
  return request({
    url: `/ai/modelConfig/${id}`,
    method: 'get'
  })
}

// 新增
export function addModelConfig(data) {
  return request({
    url: '/ai/modelConfig',
    method: 'post',
    data
  })
}

// 修改
export function updateModelConfig(data) {
  return request({
    url: '/ai/modelConfig',
    method: 'put',
    data
  })
}

// 删除
export function delModelConfig(ids) {
  return request({
    url: `/ai/modelConfig/${ids}`,
    method: 'delete'
  })
}

// 设置默认
export function setDefaultModelConfig(id) {
  return request({
    url: `/ai/modelConfig/setDefault/${id}`,
    method: 'put'
  })
}