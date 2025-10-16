import request from '@/utils/request'

// 查询工作流列表
export function listWorkflows(query) {
  return request({
    url: '/ai/workflow/list',
    method: 'get',
    params: query
  })
}

// 获取工作流详情
export function getWorkflow(id) {
  return request({
    url: `/ai/workflow/${id}`,
    method: 'get'
  })
}

// 新增工作流
export function addWorkflow(data) {
  return request({
    url: '/ai/workflow',
    method: 'post',
    data
  })
}

// 修改工作流
export function updateWorkflow(data) {
  return request({
    url: '/ai/workflow',
    method: 'put',
    data
  })
}

// 删除工作流
export function delWorkflow(ids) {
  return request({
    url: `/ai/workflow/${ids}`,
    method: 'delete'
  })
}

// 启用/禁用工作流
export function toggleWorkflowStatus(id) {
  return request({
    url: `/ai/workflow/toggle/${id}`,
    method: 'put'
  })
}

// 获取所有启用的工作流列表
export function getEnabledWorkflows() {
  return request({
    url: '/ai/workflow/enabled',
    method: 'get'
  })
}