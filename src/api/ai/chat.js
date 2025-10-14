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
  const { onMessage, onError, onComplete, onToolCall, onToolResult } = callbacks;
  const { maxRetries = 5, retryDelay = 1000, enableVisibilityReconnect = true } = options;
  
  let retryCount = 0;
  let abortController = new AbortController();
  let isCompleted = false;
  let isAborted = false;
  let visibilityReconnectTimer = null;
  let lastActivity = Date.now();
  let heartbeatTimer = null;
  
  // 页面可见性状态管理
  let wasHidden = false;
  
  // 页面可见性变化处理
  function handleVisibilityChange() {
    if (!enableVisibilityReconnect || isCompleted || isAborted) return;
    
    if (document.hidden) {
      // 页面被隐藏，记录状态但不立即断开连接
      wasHidden = true;
      console.log('页面被隐藏，标记状态');
    } else if (wasHidden) {
      // 页面重新可见，检查连接状态
      wasHidden = false;
      const timeSinceLastActivity = Date.now() - lastActivity;
      console.log(`页面重新可见，距离上次活动: ${timeSinceLastActivity}ms`);
      
      // 如果超过30秒没有活动，尝试重新连接
      if (timeSinceLastActivity > 30000) {
        console.log('检测到长时间不活跃，尝试重新连接');
        // 取消当前连接并重新连接
        abortController.abort();
        retryCount = 0; // 重置重试计数
        
        // 延迟一点时间再重连，避免频繁重连
        visibilityReconnectTimer = setTimeout(() => {
          if (!isCompleted && !isAborted) {
            abortController = new AbortController();
            attemptConnection().catch(error => {
              console.error('可见性重连失败:', error);
              if (onError && !isCompleted) onError(`重连失败: ${error.message}`);
            });
          }
        }, 1000);
      }
    }
  }
  
  // 心跳检测
  function startHeartbeat() {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(() => {
      if (isCompleted || isAborted) {
        clearInterval(heartbeatTimer);
        return;
      }
      
      const timeSinceLastActivity = Date.now() - lastActivity;
      // 如果超过2分钟没有收到数据，可能连接已断开
      if (timeSinceLastActivity > 120000) {
        console.warn('检测到连接可能已断开，尝试重连');
        abortController.abort();
        retryCount = Math.max(0, retryCount - 1); // 适当减少重试计数
        
        setTimeout(() => {
          if (!isCompleted && !isAborted) {
            abortController = new AbortController();
            attemptConnection().catch(error => {
              console.error('心跳重连失败:', error);
            });
          }
        }, 2000);
      }
    }, 30000); // 每30秒检查一次
  }
  
  function attemptConnection() {
    return new Promise((resolve, reject) => {
      const baseURL = import.meta.env.VITE_APP_BASE_API || '';
      const url = `${baseURL}/ai/chat/stream`;
      
      console.log(`尝试SSE连接 (第${retryCount + 1}次)`);
      
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Authorization': getToken()
        },
        body: JSON.stringify(data),
        signal: abortController.signal
      }).then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        console.log('SSE连接建立成功');
        retryCount = 0; // 连接成功后重置重试计数
        lastActivity = Date.now();
        startHeartbeat();
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        // 解析 SSE 事件块（以 \n\n 作为事件边界，支持多行 data）
        function processEvents(text) {
          lastActivity = Date.now(); // 更新活动时间
          const events = text.split('\n\n');
          for (const evt of events) {
            if (!evt || !evt.trim()) continue;
            const lines = evt.split('\n');
            const dataLines = [];
            for (const line of lines) {
              if (line.startsWith('data:')) {
                const data = line.slice(5).trimStart();
                dataLines.push(data);
              }
            }
            if (dataLines.length === 0) continue;
            const payload = dataLines.join('\n');
            
            if (payload === '[DONE]') {
              console.log('收到完成信号');
              isCompleted = true;
              cleanup();
              if (onComplete) onComplete();
              resolve();
              return true;
            }
            
            try {
              const eventData = JSON.parse(payload);
              if (eventData.type === 'message' && onMessage) {
                onMessage(eventData.content ?? '');
              } else if (eventData.type === 'tool_call' && onToolCall) {
                onToolCall(eventData.toolName, eventData.toolArgs);
              } else if (eventData.type === 'tool_result' && onToolResult) {
                onToolResult(eventData.toolName, eventData.result);
              } else if (eventData.type === 'error') {
                const errMsg = eventData.content || '未知错误';
                isCompleted = true;
                cleanup();
                if (onError) onError(errMsg);
                reject(new Error(errMsg));
                return true;
              } else {
                // 未知类型，作为纯文本回退
                if (onMessage) onMessage(payload);
              }
            } catch (e) {
              // 非 JSON，作为纯文本
              if (onMessage) onMessage(payload);
            }
          }
          return false;
        }
        
        function readStream() {
          return reader.read().then(({ done, value }) => {
            if (done) {
              console.log('SSE流读取完成');
              isCompleted = true;
              cleanup();
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
              if (finished) return;
            }
            
            return readStream();
          }).catch(error => {
            if (error.name === 'AbortError') {
              console.log('SSE连接被主动取消');
              resolve();
              return;
            }
            throw error;
          });
        }
        
        return readStream();
      }).catch(error => {
        if (error.name === 'AbortError') {
          console.log('连接被取消');
          resolve();
          return;
        }
        
        console.error('SSE连接错误:', error.message);
        
        // 智能重连逻辑
        const shouldRetry = retryCount < maxRetries && !isCompleted && !isAborted;
        const isNetworkError = error.message.includes('fetch') || 
                              error.message.includes('network') || 
                              error.message.includes('Failed to fetch');
        
        if (shouldRetry && (isNetworkError || error.message.includes('HTTP 5'))) {
          retryCount++;
          const delay = Math.min(retryDelay * Math.pow(2, retryCount - 1), 10000); // 指数退避，最大10秒
          console.warn(`SSE连接失败，${delay}ms后重试 (${retryCount}/${maxRetries}):`, error.message);
          
          setTimeout(() => {
            if (!isCompleted && !isAborted) {
              abortController = new AbortController();
              attemptConnection().then(resolve).catch(reject);
            }
          }, delay);
        } else {
          cleanup();
          if (onError && !isCompleted) onError(`连接失败: ${error.message}`);
          reject(error);
        }
      });
    });
  }
  
  // 清理资源
  function cleanup() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    if (visibilityReconnectTimer) {
      clearTimeout(visibilityReconnectTimer);
      visibilityReconnectTimer = null;
    }
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  }
  
  // 监听页面可见性变化
  if (enableVisibilityReconnect) {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }
  
  const connectionPromise = attemptConnection();
  
  // 返回包含取消方法的对象
  return {
    promise: connectionPromise,
    abort: () => {
      console.log('主动取消SSE连接');
      isAborted = true;
      cleanup();
      abortController.abort();
    }
  };
}