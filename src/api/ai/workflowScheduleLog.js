import request from '@/utils/request'

// 查询工作流定时调度日志列表
export function listScheduleLogs(query) {
  const workflowId = query.workflowId
  return request({
    url: `/ai/workflow/${workflowId}/schedules/logs`,
    method: 'get',
    params: query
  })
}

// 获取日志统计信息
export function getLogStatistics(params = {}) {
  const workflowId = params.workflowId
  return request({
    url: `/ai/workflow/${workflowId}/schedules/statistics`,
    method: 'get',
    params: params
  })
}
