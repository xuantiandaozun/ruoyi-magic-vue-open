import request from '@/utils/request';

// 基础聊天接口
export function chat(data) {
  return request({
    url: '/ai/chat',
    method: 'post',
    isFullResponse: true,
    data: data
  })
}

// 流式聊天接口
export function chatStream(data) {
  return request({
    url: '/ai/chat/stream',
    method: 'post',
    data: data,
    isFullResponse: true,
    responseType: 'stream'
  })
}

// 获取当前AI模型信息
export function getCurrentModel() {
  return request({
    url: '/ai/chat/model/current',
    isFullResponse: true,
    method: 'get'
  })
}

// 切换AI模型
export function switchModel(data) {
  return request({
    url: '/ai/chat/model/switch',
    isFullResponse: true,
    method: 'post',
    data: data
  })
}

// 测试AI连接
export function testConnection(message = '你好') {
  return request({
    url: '/ai/chat/test',
    method: 'get',
    isFullResponse: true,
    params: {
      message: message
    }
  })
}

// 获取聊天历史记录
export function getChatHistory() {
  return request({
    url: '/ai/chat/history',
    isFullResponse: true,
    method: 'get'
  })
}

// 清空聊天历史记录
export function clearChatHistory() {
  return request({
    url: '/ai/chat/history',
    isFullResponse: true,
    method: 'delete'
  })
}

// 创建SSE连接进行流式聊天
export function createChatStream(data, onMessage, onError, onComplete) {
  const eventSource = new EventSource(`/api/ai/chat/stream?message=${encodeURIComponent(data.message)}&systemPrompt=${encodeURIComponent(data.systemPrompt || '')}`);
  
  eventSource.onmessage = function(event) {
    if (event.data === '[DONE]') {
      eventSource.close();
      if (onComplete) onComplete();
      return;
    }
    if (onMessage) onMessage(event.data);
  };
  
  eventSource.addEventListener('error', function(event) {
    eventSource.close();
    if (onError) onError(event.data || '连接错误');
  });
  
  eventSource.addEventListener('done', function(event) {
    eventSource.close();
    if (onComplete) onComplete();
  });
  
  return eventSource;
}