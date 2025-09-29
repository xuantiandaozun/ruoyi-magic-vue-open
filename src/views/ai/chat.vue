<template>
  <div class="ai-chat-container">
    <div class="chat-header">
      <h2>AI 智能助手</h2>
      <el-button type="danger" size="small" @click="clearHistory">清空对话</el-button>
    </div>
    
    <div class="chat-content" ref="chatContent">
      <div class="message-list">
        <div 
          v-for="(message, index) in messages" 
          :key="index" 
          :class="['message-item', message.role === 'user' ? 'user-message' : 'ai-message']"
        >
          <div class="message-avatar">
            <el-avatar v-if="message.role === 'user'" :icon="UserFilled" />
            <el-avatar v-else background-color="#409eff">
              <el-icon><ChatDotRound /></el-icon>
            </el-avatar>
          </div>
          <div class="message-content">
            <div class="message-text" v-html="formatMessage(message.content)"></div>
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>
      </div>
      
      <!-- 加载状态 -->
      <div v-if="isLoading" class="message-item ai-message">
        <div class="message-avatar">
          <el-avatar background-color="#409eff">
            <el-icon><ChatDotRound /></el-icon>
          </el-avatar>
        </div>
        <div class="message-content">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="chat-input">
      <div class="chat-input-inner">
        <el-input
          v-model="inputMessage"
          type="textarea"
          :rows="3"
          placeholder="请输入您的问题..."
          @keydown.enter.prevent="handleSend"
          :disabled="isLoading"
        />
        <div class="input-actions">
          <el-button type="primary" @click="handleSend" :loading="isLoading">发送</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { chat, clearChatHistory, getChatHistory } from '@/api/ai/chat'
import { ChatDotRound, UserFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { marked } from 'marked'
import { nextTick, onMounted, ref } from 'vue'

// 响应式数据
const messages = ref([])
const inputMessage = ref('')
const isLoading = ref(false)
const chatContent = ref(null)

// 组件挂载时加载历史记录
onMounted(() => {
  loadChatHistory()
})

// 加载聊天历史记录
const loadChatHistory = async () => {
  try {
    const response = await getChatHistory()
    if (response.code === 200 && response.data) {
      messages.value = response.data.map(item => ({
        role: item.role,
        content: item.content,
        timestamp: new Date(item.createTime)
      }))
      scrollToBottom()
    }
  } catch (error) {
    console.error('加载聊天历史失败:', error)
  }
}

// 发送消息
const handleSend = async () => {
  if (!inputMessage.value.trim() || isLoading.value) {
    return
  }
  
  const userMessage = {
    role: 'user',
    content: inputMessage.value.trim(),
    timestamp: new Date()
  }
  
  messages.value.push(userMessage)
  const currentInput = inputMessage.value
  inputMessage.value = ''
  isLoading.value = true
  
  await nextTick()
  scrollToBottom()
  
  try {
    const response = await chat({
      message: currentInput,
      history: messages.value.slice(0, -1), // 不包含刚发送的消息
      
    })
    console.log('API响应:', response)
    
    if (response.code === 200) {
      const aiMessage = {
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date()
      }
      messages.value.push(aiMessage)
    } else {
      ElMessage.error(response.msg || '发送失败，请重试')
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('网络错误，请检查连接后重试')
  } finally {
    isLoading.value = false
    await nextTick()
    scrollToBottom()
  }
}

// 清空对话历史
const clearHistory = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有对话记录吗？此操作不可恢复。',
      '确认清空',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await clearChatHistory()
    messages.value = []
    ElMessage.success('对话记录已清空')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清空对话失败:', error)
      ElMessage.error('清空失败，请重试')
    }
  }
}

// 格式化消息内容（支持Markdown）
const formatMessage = (content) => {
  try {
    return marked(content)
  } catch (error) {
    return content
  }
}

// 格式化时间
const formatTime = (timestamp) => {
  const now = new Date()
  const time = new Date(timestamp)
  const diff = now - time
  
  if (diff < 60000) { // 1分钟内
    return '刚刚'
  } else if (diff < 3600000) { // 1小时内
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) { // 24小时内
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    return time.toLocaleDateString() + ' ' + time.toLocaleTimeString()
  }
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (chatContent.value) {
      chatContent.value.scrollTop = chatContent.value.scrollHeight
    }
  })
}
</script>

<style scoped>
.ai-chat-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  background: #ffffff;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: transparent;
  border-bottom: 1px solid transparent;
  position: sticky;
  top: 0;
  z-index: 10;
}

.chat-header h2 {
  margin: 0;
  color: #111827;
  font-size: 18px;
  font-weight: 600;
}

.chat-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 860px;
  margin: 0 auto;
}

.message-item {
  display: flex;
  gap: 12px;
  max-width: 100%;
  animation: fadeInUp 0.2s ease-out;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.user-message {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.ai-message {
  align-self: flex-start;
}

.message-avatar {
  flex-shrink: 0;
}

.message-avatar :deep(.el-avatar) {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

.message-content {
  flex: 1;
  max-width: 70ch;
}

.message-text {
  padding: 14px 16px;
  border-radius: 16px;
  line-height: 1.75;
  word-wrap: break-word;
  font-size: 15px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.user-message .message-text {
  background: #eaf2ff;
  color: #0f172a;
  border-bottom-right-radius: 6px;
  border: 1px solid #e1e8ff;
}

.ai-message .message-text {
  background: #ffffff;
  color: #111827;
  border-bottom-left-radius: 6px;
  border: 1px solid #e5e7eb;
}

.message-time {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 6px;
  text-align: right;
}

.user-message .message-time {
  text-align: left;
}

.typing-indicator {
  display: flex;
  gap: 6px;
  padding: 12px 16px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  border-bottom-left-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #6366f1;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.chat-input {
  padding: 24px;
  background: #ffffff;
  border-top: 1px solid transparent;
  position: sticky;
  bottom: 0;
}

.chat-input-inner {
  max-width: 860px;
  margin: 0 auto;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  padding: 16px;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.chat-input :deep(.el-textarea__inner) {
  border-radius: 14px;
  border-color: #e5e7eb;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  background-color: #f5f7fa;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
  max-width: 860px;
  margin-left: auto;
  margin-right: auto;
}

.input-actions .el-button {
  border-radius: 999px;
  padding: 10px 18px;
}

/* 滚动条样式 */
.chat-content::-webkit-scrollbar {
  width: 6px;
}

.chat-content::-webkit-scrollbar-track {
  background: #efefef;
  border-radius: 3px;
}

.chat-content::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.chat-content::-webkit-scrollbar-thumb:hover {
  background: #c0c6cf;
}

/* Markdown 样式（对齐 OpenAI 的暗色代码块体验） */
.message-text :deep(pre) {
  background: #0f172a;
  color: #e5e7eb;
  padding: 12px;
  border-radius: 10px;
  overflow-x: auto;
  margin: 10px 0;
  border: 1px solid #1f2937;
}

.message-text :deep(code) {
  background: rgba(31, 41, 55, 0.9);
  color: #e5e7eb;
  padding: 2px 6px;
  border-radius: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}

.message-text :deep(blockquote) {
  border-left: 4px solid #e5e7eb;
  padding-left: 12px;
  margin: 10px 0;
  color: #6b7280;
}
</style>