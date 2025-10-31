import request from '@/utils/request'

// 获取聊天会话列表
export function getChatSessions(query) {
  return request({
    url: '/ai/chat/sessions',
    method: 'get',
    params: query,
    isFullResponse: true
  })
}

// 获取指定会话详情
export function getChatSession(sessionId) {
  return request({
    url: `/ai/chat/sessions/${sessionId}`,
    method: 'get',
    isFullResponse: true
  })
}

// 获取会话消息列表
export function getSessionMessages(sessionId, query) {
  return request({
    url: `/ai/chat/sessions/${sessionId}/messages`,
    method: 'get',
    params: query,
    isFullResponse: true
  })
}

// 创建新的聊天会话
export function createChatSession(data) {
  return request({
    url: '/ai/chat/sessions',
    method: 'post',
    data: data,
    isFullResponse: true
  })
}

// 更新聊天会话
export function updateChatSession(sessionId, data) {
  return request({
    url: `/ai/chat/sessions/${sessionId}`,
    method: 'post',
    data: data,
    isFullResponse: true
  })
}

// 删除聊天会话
export function deleteChatSession(sessionId) {
  return request({
    url: `/ai/chat/sessions/${sessionId}`,
    method: 'delete',
    isFullResponse: true
  })
}

// 批量删除聊天会话
export function batchDeleteChatSessions(sessionIds) {
  return request({
    url: '/ai/chat/sessions',
    method: 'delete',
    data: sessionIds,
    isFullResponse: true
  })
}

// 清空所有聊天历史（删除所有会话）
export function clearAllChatHistory() {
  return request({
    url: '/ai/chat/history/clear',
    method: 'delete',
    isFullResponse: true
  })
}

// 清空指定会话的历史消息
export function clearSessionHistory(sessionId) {
  return request({
    url: `/ai/chat/sessions/${sessionId}/messages`,
    method: 'delete',
    isFullResponse: true
  })
}

// 保存AI消息
export function saveAiMessage(data) {
  return request({
    url: '/ai/chat/message/save',
    method: 'post',
    data: data,
    isFullResponse: true
  })
}