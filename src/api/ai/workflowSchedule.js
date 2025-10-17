import request from '@/utils/request'

// 查询工作流定时调度配置列表
export function listSchedules(query) {
  return request({
    url: '/ai/workflow/schedule/list',
    method: 'get',
    params: query
  })
}

// 根据工作流ID查询调度配置列表
export function listSchedulesByWorkflowId(workflowId) {
  return request({
    url: `/ai/workflow/schedule/workflow/${workflowId}`,
    method: 'get'
  })
}

// 获取工作流的定时调度配置列表（在工作流控制器中）
export function getWorkflowSchedules(workflowId) {
  return request({
    url: `/ai/workflow/${workflowId}/schedules`,
    method: 'get'
  })
}

// 获取调度配置详情
export function getSchedule(id) {
  return request({
    url: `/ai/workflow/schedule/${id}`,
    method: 'get'
  })
}

// 新增调度配置
export function addSchedule(data) {
  return request({
    url: '/ai/workflow/schedule',
    method: 'post',
    data: data
  })
}

// 为工作流创建定时调度配置（在工作流控制器中）
export function createWorkflowSchedule(workflowId, data) {
  return request({
    url: `/ai/workflow/${workflowId}/schedule`,
    method: 'post',
    data: data
  })
}

// 修改调度配置
export function updateSchedule(data) {
  return request({
    url: '/ai/workflow/schedule',
    method: 'put',
    data: data
  })
}

// 删除调度配置
export function delSchedule(ids) {
  return request({
    url: `/ai/workflow/schedule/${ids}`,
    method: 'delete'
  })
}

// 启动调度任务
export function startSchedule(id) {
  return request({
    url: `/ai/workflow/schedule/start/${id}`,
    method: 'put'
  })
}

// 暂停调度任务
export function pauseSchedule(id) {
  return request({
    url: `/ai/workflow/schedule/pause/${id}`,
    method: 'put'
  })
}

// 恢复调度任务
export function resumeSchedule(id) {
  return request({
    url: `/ai/workflow/schedule/resume/${id}`,
    method: 'put'
  })
}

// 立即执行一次调度任务
export function executeScheduleOnce(id) {
  return request({
    url: `/ai/workflow/schedule/execute/${id}`,
    method: 'put'
  })
}

// 批量启动调度任务
export function startSchedulesBatch(ids) {
  return request({
    url: '/ai/workflow/schedule/start/batch',
    method: 'put',
    data: ids
  })
}

// 批量暂停调度任务
export function pauseSchedulesBatch(ids) {
  return request({
    url: '/ai/workflow/schedule/pause/batch',
    method: 'put',
    data: ids
  })
}

// 获取启用的调度配置列表
export function getEnabledSchedules() {
  return request({
    url: '/ai/workflow/schedule/enabled',
    method: 'get'
  })
}

// 启用工作流的所有定时调度
export function enableAllWorkflowSchedules(workflowId) {
  return request({
    url: `/ai/workflow/${workflowId}/schedules/enable`,
    method: 'put'
  })
}

// 禁用工作流的所有定时调度
export function disableAllWorkflowSchedules(workflowId) {
  return request({
    url: `/ai/workflow/${workflowId}/schedules/disable`,
    method: 'put'
  })
}

// 获取工作流定时调度统计信息
export function getWorkflowScheduleStatistics(workflowId) {
  return request({
    url: `/ai/workflow/${workflowId}/schedules/statistics`,
    method: 'get'
  })
}