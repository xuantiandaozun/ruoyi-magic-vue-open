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

// 同步 OpenRouter 免费模型
export function syncOpenRouterFreeModels() {
  return request({
    url: '/ai/modelConfig/syncOpenRouterFree',
    method: 'put'
  })
}

// 获取可用聊天模型
export function getAvailableChatModels() {
  return request({
    url: '/ai/modelConfig/chat/available',
    method: 'get'
  })
}
