import request from '@/utils/request';
import { getToken } from '@/utils/auth';

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

// 获取可用的聊天模型列表
export function getAvailableChatModels() {
  return request({
    url: '/ai/modelConfig/chat/available',
    method: 'get',
    isFullResponse: true
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
export function createChatStream(data, callbacks, options = {}) {
  const { onMessage, onError, onComplete } = callbacks;
  const { maxRetries = 3, retryDelay = 1000 } = options;
  
  let retryCount = 0;
  let abortController = new AbortController();
  
  function attemptConnection() {
    return new Promise((resolve, reject) => {
      const baseURL = import.meta.env.VITE_APP_BASE_API || '';
      const url = `${baseURL}/ai/chat/stream`;
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Authorization': getToken()
        },
        body: JSON.stringify(data),
        signal: abortController.signal
      }).then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        // 解析 SSE 事件块（以 \n\n 作为事件边界，支持多行 data）
        function processEvents(text) {
          console.log('处理SSE事件:', text); // 调试信息
          const events = text.split('\n\n');
          for (const evt of events) {
            if (!evt || !evt.trim()) continue;
            console.log('处理单个事件:', evt); // 调试信息
            const lines = evt.split('\n');
            const dataLines = [];
            for (const line of lines) {
              if (line.startsWith('data:')) {
                // 保留行内可能的值但移除前缀
                const data = line.slice(5).trimStart();
                console.log('提取的数据:', data); // 调试信息
                dataLines.push(data);
              }
            }
            if (dataLines.length === 0) continue;
            const payload = dataLines.join('\n');
            
            if (payload === '[DONE]') {
              console.log('收到完成信号'); // 调试信息
              if (onComplete) onComplete();
              resolve();
              return true; // 指示完成
            }
            
            try {
              const eventData = JSON.parse(payload);
              console.log('解析的事件数据:', eventData); // 调试信息
              if (eventData.type === 'message' && onMessage) {
                console.log('调用onMessage:', eventData.content); // 调试信息
                onMessage(eventData.content ?? '');
              } else if (eventData.type === 'error') {
                const errMsg = eventData.content || '未知错误';
                if (onError) onError(errMsg);
                reject(new Error(errMsg));
                return true; // 终止读取
              } else {
                // 未知类型，作为纯文本回退
                console.log('未知类型，作为纯文本:', payload); // 调试信息
                if (onMessage) onMessage(payload);
              }
            } catch (e) {
              // 非 JSON，作为纯文本
              console.log('JSON解析失败，作为纯文本:', payload, e); // 调试信息
              if (onMessage) onMessage(payload);
            }
          }
          return false;
        }
        
        function readStream() {
          return reader.read().then(({ done, value }) => {
            if (done) {
              if (onComplete) onComplete();
              resolve();
              return;
            }
            
            // 增量解码并处理完整事件块
            buffer += decoder.decode(value, { stream: true });
            const lastBoundary = buffer.lastIndexOf('\n\n');
            if (lastBoundary !== -1) {
              const processable = buffer.slice(0, lastBoundary);
              buffer = buffer.slice(lastBoundary + 2);
              const finished = processEvents(processable);
              if (finished) return; // 已完成或错误
            }
            
            return readStream();
          }).catch(error => {
            if (error.name === 'AbortError') {
              resolve(); // 用户主动取消
              return;
            }
            throw error;
          });
        }
        
        return readStream();
      }).catch(error => {
        if (error.name === 'AbortError') {
          resolve(); // 用户主动取消
          return;
        }
        
        // 网络错误或其他错误，尝试重连
        if (retryCount < maxRetries) {
          retryCount++;
          console.warn(`SSE连接失败，正在重试 (${retryCount}/${maxRetries}):`, error.message);
          
          setTimeout(() => {
            attemptConnection().then(resolve).catch(reject);
          }, retryDelay * retryCount); // 递增延迟
        } else {
          if (onError) onError(`连接失败: ${error.message}`);
          reject(error);
        }
      });
    });
  }
  
  const connectionPromise = attemptConnection();
  
  // 返回包含取消方法的对象
  return {
    promise: connectionPromise,
    abort: () => {
      abortController.abort();
    }
  };
}