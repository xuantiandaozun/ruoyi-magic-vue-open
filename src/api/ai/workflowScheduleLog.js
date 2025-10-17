import request from '@/utils/request'

// 查询工作流定时调度日志列表
export function listScheduleLogs(query) {
  return request({
    url: '/ai/workflow/schedule/log/list',
    method: 'get',
    params: query
  })
}

// 根据调度ID查询日志列表
export function listLogsByScheduleId(scheduleId) {
  return request({
    url: `/ai/workflow/schedule/log/schedule/${scheduleId}`,
    method: 'get'
  })
}

// 根据工作流ID查询日志列表
export function listLogsByWorkflowId(workflowId) {
  return request({
    url: `/ai/workflow/schedule/log/workflow/${workflowId}`,
    method: 'get'
  })
}

// 根据状态查询日志列表
export function listLogsByStatus(status) {
  return request({
    url: `/ai/workflow/schedule/log/status/${status}`,
    method: 'get'
  })
}

// 根据触发类型查询日志列表
export function listLogsByTriggerType(triggerType) {
  return request({
    url: `/ai/workflow/schedule/log/trigger/${triggerType}`,
    method: 'get'
  })
}

// 获取日志详情
export function getScheduleLog(id) {
  return request({
    url: `/ai/workflow/schedule/log/${id}`,
    method: 'get'
  })
}

// 删除调度日志
export function delScheduleLog(ids) {
  return request({
    url: `/ai/workflow/schedule/log/${ids}`,
    method: 'delete'
  })
}

// 清理过期日志
export function cleanExpiredLogs(days = 30) {
  return request({
    url: '/ai/workflow/schedule/log/clean',
    method: 'delete',
    params: { days }
  })
}

// 获取日志统计信息
export function getLogStatistics(params = {}) {
  return request({
    url: '/ai/workflow/schedule/log/statistics',
    method: 'get',
    params: params
  })
}

// 获取最近执行日志
export function getRecentLogs(limit = 10) {
  return request({
    url: '/ai/workflow/schedule/log/recent',
    method: 'get',
    params: { limit }
  })
}