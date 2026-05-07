import request from '@/utils/request'

// 获取工作流的定时调度配置列表
export function getWorkflowSchedules(workflowId) {
  return request({
    url: `/ai/workflow/${workflowId}/schedules`,
    method: 'get'
  })
}

// 立即执行一次调度任务
export function executeWorkflowSchedule(workflowId, scheduleId) {
  return request({
    url: `/ai/workflow/${workflowId}/schedules/${scheduleId}/execute`,
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
