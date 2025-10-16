import request from '@/utils/request'

// 执行工作流
export function executeWorkflow(data) {
  return request({
    url: '/ai/workflow/execution/execute',
    method: 'post',
    data
  })
}

// 快速执行工作流
export function quickExecuteWorkflow(workflowId, inputData) {
  return request({
    url: `/ai/workflow/execution/quickExecute/${workflowId}`,
    method: 'post',
    data: inputData
  })
}

// 查询工作流执行历史列表
export function listWorkflowExecutions(query) {
  return request({
    url: '/ai/workflow/execution/list',
    method: 'get',
    params: query
  })
}

// 获取工作流执行详情
export function getWorkflowExecution(id) {
  return request({
    url: `/ai/workflow/execution/${id}`,
    method: 'get'
  })
}

// 新增工作流执行记录（一般由系统自动创建）
export function addWorkflowExecution(data) {
  return request({
    url: '/ai/workflow/execution',
    method: 'post',
    data
  })
}

// 修改工作流执行记录
export function updateWorkflowExecution(data) {
  return request({
    url: '/ai/workflow/execution',
    method: 'put',
    data
  })
}

// 删除工作流执行记录
export function delWorkflowExecution(ids) {
  return request({
    url: `/ai/workflow/execution/${ids}`,
    method: 'delete'
  })
}

// 获取工作流的变量信息
export function getWorkflowVariables(workflowId) {
  return request({
    url: `/ai/workflow/execution/variables/${workflowId}`,
    method: 'get'
  })
}