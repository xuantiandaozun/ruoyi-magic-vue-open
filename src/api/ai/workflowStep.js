import request from '@/utils/request'

// 查询工作流步骤列表
export function listWorkflowSteps(query) {
  return request({
    url: '/ai/workflow/step/list',
    method: 'get',
    params: query
  })
}

// 根据工作流ID查询步骤列表
export function listStepsByWorkflowId(workflowId) {
  return request({
    url: '/ai/workflow/step/listByWorkflowId',
    method: 'get',
    params: { workflowId }
  })
}

// 获取工作流步骤详情
export function getWorkflowStep(id) {
  return request({
    url: `/ai/workflow/step/${id}`,
    method: 'get'
  })
}

// 新增工作流步骤
export function addWorkflowStep(data) {
  return request({
    url: '/ai/workflow/step',
    method: 'post',
    data
  })
}

// 修改工作流步骤
export function updateWorkflowStep(data) {
  return request({
    url: '/ai/workflow/step',
    method: 'put',
    data
  })
}

// 删除工作流步骤
export function delWorkflowStep(ids) {
  return request({
    url: `/ai/workflow/step/${ids}`,
    method: 'delete'
  })
}

// 启用/禁用工作流步骤
export function toggleWorkflowStepStatus(id) {
  return request({
    url: `/ai/workflow/step/toggle/${id}`,
    method: 'put'
  })
}

// 验证用户提示词中的变量
export function validatePromptVariables(userPrompt) {
  return request({
    url: '/ai/workflow/step/validatePromptVariables',
    method: 'post',
    data: userPrompt,
    headers: {
      'Content-Type': 'text/plain'
    }
  })
}