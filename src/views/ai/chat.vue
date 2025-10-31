<template>
  <div class="ai-chat-container">
    <!-- 会话管理侧边栏 -->
    <div class="chat-sidebar" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <div class="sidebar-header">
        <div class="sidebar-title">
          <el-icon><ChatDotRound /></el-icon>
          <span v-if="!sidebarCollapsed">聊天会话</span>
        </div>
        <div class="sidebar-actions">
          <el-button 
            v-if="!sidebarCollapsed"
            type="primary" 
            size="small" 
            @click="createNewSession"
            :icon="Plus"
          >
            新建会话
          </el-button>
          <el-button 
            type="text" 
            size="small" 
            @click="toggleSidebar"
            :icon="sidebarCollapsed ? ArrowRight : ArrowLeft"
          />
        </div>
      </div>
      
      <div v-if="!sidebarCollapsed" class="session-list">
        <div 
          v-for="session in chatSessions" 
          :key="session.id"
          :class="['session-item', { 'active': currentSessionId === session.id }]"
          @click="switchToSession(session.id)"
        >
          <div class="session-content">
            <div class="session-title">{{ session.sessionName || '新对话' }}</div>
            <div class="session-time">{{ formatTime(session.updateTime) }}</div>
          </div>
          <div class="session-actions">
            <el-dropdown @command="handleSessionAction">
              <el-button type="text" size="small">
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="{ action: 'rename', sessionId: session.id }">重命名</el-dropdown-item>
                  <el-dropdown-item :command="{ action: 'delete', sessionId: session.id }" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
        
        <div v-if="chatSessions.length === 0" class="empty-sessions">
          <el-empty description="暂无会话" :image-size="80" />
        </div>
      </div>
    </div>
    
    <!-- 主聊天区域 -->
    <div class="chat-main" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
    <div class="chat-header">
      <div class="header-left">
        <h2>AI 智能助手</h2>
        <div class="model-selector">
          <span class="model-label">当前模型:</span>
          <el-select 
            v-model="selectedModelId" 
            placeholder="选择聊天模型" 
            @change="handleModelChange"
            style="width: 200px;"
            size="small"
          >
            <el-option
              v-for="model in chatModels"
              :key="model.id"
              :label="`${model.provider}/${model.model}`"
              :value="model.id"
            />
          </el-select>

        </div>
      </div>
      <div>
        
        <el-button type="danger" size="small" @click="clearHistory" style="margin-left:8px;">清空对话</el-button>
      </div>
    </div>
    
    <div class="chat-content" ref="chatContent">
      <div class="message-list">
        <div 
          v-for="(message, index) in messages" 
          :key="index" 
          :class="['message-item', message.role === 'user' ? 'user-message' : 'ai-message']"
        >
          <div class="message-wrapper">
            <div class="message-avatar">
              <el-avatar v-if="message.role === 'user'" :icon="UserFilled" />
              <el-avatar v-else background-color="#10a37f">
                <el-icon><ChatDotRound /></el-icon>
              </el-avatar>
            </div>
            <div class="message-content">
              <!-- 工具调用显示 -->
              <div v-if="message.toolCalls && message.toolCalls.length > 0" class="tool-calls-section">
                <div 
                  v-for="(toolCall, toolIndex) in message.toolCalls" 
                  :key="toolIndex"
                  class="tool-call-item"
                >
                  <el-collapse v-model="toolCall.activeNames" class="tool-call-collapse">
                    <el-collapse-item :name="'tool-' + toolIndex" class="tool-call-panel">
                      <template #title>
                        <div class="tool-call-header">
                          <el-icon class="tool-icon"><Tools /></el-icon>
                          <span class="tool-name">{{ toolCall.name }}</span>
                          <el-tag 
                            :type="toolCall.status === 'completed' ? 'success' : toolCall.status === 'error' ? 'danger' : 'info'"
                            size="small"
                            class="tool-status"
                          >
                            {{ getToolStatusText(toolCall.status) }}
                          </el-tag>
                        </div>
                      </template>
                      <div class="tool-call-content">
                        <div v-if="toolCall.input" class="tool-input">
                          <div class="tool-section-title">输入参数:</div>
                          <pre class="tool-data">{{ formatToolData(toolCall.input) }}</pre>
                        </div>
                        <div v-if="toolCall.output" class="tool-output">
                          <div class="tool-section-title">执行结果:</div>
                          <pre class="tool-data">{{ formatToolData(toolCall.output) }}</pre>
                        </div>
                      </div>
                    </el-collapse-item>
                  </el-collapse>
                </div>
              </div>
              
              <div class="message-text" v-html="formatMessage(message.content)"></div>
              <!-- 流式输入光标 -->
              <span v-if="index === streamingMessageIndex" class="typing-cursor">|</span>
              <!-- AI消息复制按钮 -->
              <div v-if="message.role === 'assistant' && message.content" class="message-actions">
                <el-button 
                  type="text" 
                  size="small" 
                  @click="copyMessage(message.content)"
                  class="copy-message-btn"
                >
                  <el-icon><DocumentCopy /></el-icon>
                  复制
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 加载状态 -->
      <div v-if="isLoading" class="message-item ai-message">
        <div class="message-wrapper">
          <div class="message-avatar">
            <el-avatar background-color="#3b82f6">
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
    </div>
    
    <div class="chat-input">
      <div class="chat-input-inner">
        <el-input
          v-model="inputMessage"
          type="textarea"
          :rows="1"
          placeholder="给AI助手发送消息"
          @keydown.enter.prevent="handleSend"
          :disabled="isLoading"
          resize="none"
        />
        <div class="input-actions">
          <el-button 
            v-if="currentConnection || streamingMessageIndex >= 0" 
            type="danger" 
            @click="handleStop"
            size="default"
          >
            停止
          </el-button>
          <el-button 
            type="primary" 
            @click="handleSend" 
            :loading="isLoading"
            :disabled="isLoading || currentConnection || streamingMessageIndex >= 0 || !inputMessage.trim()"
            size="default"
            :class="{'send-button-disabled': !inputMessage.trim()}"
          >
            发送
          </el-button>
        </div>
      </div>
    </div>
    


    <!-- 重命名会话对话框 -->
    <el-dialog v-model="renameDialogVisible" title="重命名会话" width="400px">
      <el-form :model="renameForm" :rules="renameRules" ref="renameFormRef" label-width="80px">
        <el-form-item label="会话名称" prop="title">
          <el-input v-model="renameForm.title" placeholder="请输入会话名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="renameDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitRename" :loading="renameLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>
    </div>
  </div> 
</template>

<script setup>
import { createChatStream, getAvailableChatModels, getChatHistory } from '@/api/ai/chat'
import { clearAllChatHistory, createChatSession, deleteChatSession, getChatSession, getChatSessions, getSessionMessages, saveAiMessage, updateChatSession } from '@/api/ai/chatSession'

import { ArrowLeft, ArrowRight, ChatDotRound, DocumentCopy, MoreFilled, Plus, Tools, UserFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import hljs from 'highlight.js/lib/common'
import 'highlight.js/styles/vs2015.css'
import { marked } from 'marked'
import { nextTick, onMounted, onUnmounted, ref } from 'vue'

// 配置marked和highlight.js
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value
      } catch (err) {
        console.warn('代码高亮失败:', err)
      }
    }
    return hljs.highlightAuto(code).value
  },
  breaks: true, // 支持换行
  gfm: true, // 支持GitHub风格的Markdown
  // 确保 <code> 元素包含 .hljs 以应用主题样式
  langPrefix: 'hljs language-'
})

// 复制功能相关方法
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('复制成功')
  } catch (err) {
    console.error('复制失败:', err)
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      ElMessage.success('复制成功')
    } catch (fallbackErr) {
      ElMessage.error('复制失败')
    }
    document.body.removeChild(textArea)
  }
}

// 复制代码块
const copyCodeBlock = (code) => {
  copyToClipboard(code)
}

// 复制整个消息
const copyMessage = (content) => {
  copyToClipboard(content)
}

// 工具调用相关函数
const getToolStatusText = (status) => {
  switch (status) {
    case 'calling':
      return '调用中'
    case 'completed':
      return '已完成'
    case 'error':
      return '执行失败'
    default:
      return '未知状态'
  }
}

const formatToolData = (data) => {
  if (typeof data === 'string') {
    try {
      // 尝试解析JSON并格式化
      const parsed = JSON.parse(data)
      return JSON.stringify(parsed, null, 2)
    } catch {
      // 如果不是JSON，直接返回
      return data
    }
  }
  return JSON.stringify(data, null, 2)
}

// 不再暴露全局函数，统一使用事件委托处理复制点击

// 事件委托：处理代码块复制按钮点击（避免 CSP 禁止 inline onclick）
const handleCopyClick = (e) => {
  const btn = e.target.closest?.('.copy-code-btn')
  if (!btn) return
  const wrapper = btn.closest('.code-block-wrapper')
  const codeEl = wrapper?.querySelector('pre code')
  const codeText = codeEl?.textContent || ''
  if (codeText) {
    copyCodeBlock(codeText)
  }
}

onMounted(() => {
  // 将事件绑定到聊天内容容器上
  if (chatContent.value) {
    chatContent.value.addEventListener('click', handleCopyClick)
  } else {
    // 兜底：绑定到 document
    document.addEventListener('click', handleCopyClick)
  }
})

onUnmounted(() => {
  if (chatContent.value) {
    chatContent.value.removeEventListener('click', handleCopyClick)
  } else {
    document.removeEventListener('click', handleCopyClick)
  }
})

// 响应式数据
const messages = ref([])
const inputMessage = ref('')
const isLoading = ref(false)
const chatContent = ref(null)
const currentConnection = ref(null)
const streamingMessageIndex = ref(-1) // 正在流式输入的消息索引
const toolCalls = ref([]) // 当前对话中的工具调用记录

// 会话管理相关
const chatSessions = ref([])
const currentSessionId = ref(null)
const sidebarCollapsed = ref(false)

// 重命名会话相关
const renameDialogVisible = ref(false)
const renameLoading = ref(false)
const renameFormRef = ref()
const renameForm = ref({
  sessionId: null,
  title: ''
})
const renameRules = {
  title: [{ required: true, message: '请输入会话名称', trigger: 'blur' }]
}

// 聊天模型相关
const chatModels = ref([])
const selectedModelId = ref(null)



// 组件挂载时加载会话列表和模型列表
onMounted(() => {
  loadChatSessions()
  loadChatModels()
})

// 加载聊天历史记录
const loadChatHistory = async () => {
  try {
    const response = await getChatHistory()
    if (response.code === 200 && response.data) {
      messages.value = response.data.map(item => ({
        role: item.messageRole,
        content: item.messageContent,
        timestamp: new Date(item.createTime)
      }))
      scrollToBottom()
    }
  } catch (error) {
    console.error('加载聊天历史失败:', error)
  }
}

// 加载可用的聊天模型列表
const loadChatModels = async () => {
  try {
    const response = await getAvailableChatModels()
    if (response.code === 200 && response.data) {
      chatModels.value = response.data
      // 设置默认选中的模型（选择第一个或默认模型）
      if (chatModels.value.length > 0 && !selectedModelId.value) {
        const defaultModel = chatModels.value.find(model => model.isDefault === 'Y')
        selectedModelId.value = defaultModel ? defaultModel.id : chatModels.value[0].id
      }
    }
  } catch (error) {
    console.error('加载聊天模型失败:', error)
  }
}

// 处理模型切换
const handleModelChange = (modelId) => {
  selectedModelId.value = modelId
  const selectedModel = chatModels.value.find(model => model.id === modelId)
  if (selectedModel) {
    ElMessage.success(`已切换到模型: ${selectedModel.provider}/${selectedModel.model}`)
  }
}

// 加载聊天会话列表
const loadChatSessions = async () => {
  try {
    const response = await getChatSessions({ pageNum: 1, pageSize: 50 })
    if (response.code === 200 && response.rows) {
      chatSessions.value = response.rows
      // 如果没有当前会话且有会话列表，选择第一个会话
      if (!currentSessionId.value && chatSessions.value.length > 0) {
        await switchToSession(chatSessions.value[0].id)
      } else if (chatSessions.value.length === 0) {
        // 如果没有会话，创建一个新会话
        await createNewSession()
      }
    }
  } catch (error) {
    console.error('加载会话列表失败:', error)
  }
}

// 切换到指定会话
const switchToSession = async (sessionId) => {
  try {
    currentSessionId.value = sessionId
    
    // 获取会话详情，包括模型配置ID
    const sessionResponse = await getChatSession(sessionId)
    if (sessionResponse.code === 200 && sessionResponse.data) {
      const sessionData = sessionResponse.data
      
      // 如果会话有关联的模型配置，自动切换到该模型配置
      if (sessionData.modelConfigId && sessionData.modelConfigId !== selectedModelId.value) {
        try {
          // 从聊天模型列表中找到对应的配置
          const targetModel = chatModels.value.find(model => model.id === sessionData.modelConfigId)
          if (targetModel) {
            handleModelChange(targetModel.id)
            console.log(`已自动切换到模型配置: ${targetModel.provider}/${targetModel.model}`)
          }
        } catch (error) {
          console.warn('自动切换模型配置失败:', error)
          // 不阻断会话切换流程
        }
      }
    }
    
    // 加载会话消息
    const response = await getSessionMessages(sessionId, { pageNum: 1, pageSize: 100 })
    if (response.code === 200 && response.rows) {
      messages.value = response.rows.map(item => ({
        role: item.messageRole,
        content: item.messageContent,
        timestamp: new Date(item.createTime),
        toolCalls: item.toolCalls ? JSON.parse(item.toolCalls) : []
      }))
      await nextTick()
      scrollToBottom()
    }
  } catch (error) {
    console.error('切换会话失败:', error)
    ElMessage.error('切换会话失败')
  }
}

// 创建新会话
const createNewSession = async () => {
  try {
    // 获取当前选中的模型配置
    const currentModel = chatModels.value.find(model => model.id === selectedModelId.value)
    
    const response = await createChatSession({
      sessionName: '新对话',
      sessionType: 'chat',
      status: '0',
      modelConfigId: currentModel?.id || null
    })
    if (response.code === 200 && response.data) {
      // 重新加载会话列表
      await loadChatSessions()
      // 切换到新创建的会话
      await switchToSession(response.data.id)
      ElMessage.success('创建新会话成功')
    }
  } catch (error) {
    console.error('创建会话失败:', error)
    ElMessage.error('创建会话失败')
  }
}

// 切换侧边栏显示状态
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

// 处理会话操作
const handleSessionAction = async (command) => {
  const { action, sessionId } = command
  
  if (action === 'rename') {
    // 打开重命名对话框
    const session = chatSessions.value.find(s => s.id === sessionId)
    if (session) {
      renameForm.value.sessionId = sessionId
      renameForm.value.title = session.sessionName || '新对话'
      renameDialogVisible.value = true
    }
  } else if (action === 'delete') {
    // 删除会话
    try {
      await ElMessageBox.confirm(
        '确定要删除这个会话吗？此操作不可恢复。',
        '确认删除',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      )
      
      const response = await deleteChatSession(sessionId)
      if (response.code === 200) {
        ElMessage.success('删除会话成功')
        // 如果删除的是当前会话，清空消息列表
        if (currentSessionId.value === sessionId) {
          messages.value = []
          currentSessionId.value = null
        }
        // 重新加载会话列表
        await loadChatSessions()
      }
    } catch (error) {
      if (error !== 'cancel') {
        console.error('删除会话失败:', error)
        ElMessage.error('删除会话失败')
      }
    }
  }
}

// 提交重命名
const submitRename = async () => {
  try {
    await renameFormRef.value.validate()
    renameLoading.value = true
    
    const response = await updateChatSession(renameForm.value.sessionId, {
      sessionName: renameForm.value.title
    })
    
    if (response.code === 200) {
      ElMessage.success('重命名成功')
      renameDialogVisible.value = false
      // 重新加载会话列表
      await loadChatSessions()
    }
  } catch (error) {
    console.error('重命名失败:', error)
    ElMessage.error('重命名失败')
  } finally {
    renameLoading.value = false
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
  
  // 创建AI消息占位符
  const aiMessage = {
    role: 'assistant',
    content: '',
    timestamp: new Date(),
    toolCalls: [] // 初始化工具调用数组
  }
  messages.value.push(aiMessage)
  const aiMessageIndex = messages.value.length - 1
  
  // 设置流式输入状态
  streamingMessageIndex.value = aiMessageIndex
  
  // 隐藏加载状态，因为现在使用流式输入光标
  isLoading.value = false
  
  try {
    // 如果有正在进行的连接，先取消它
    if (currentConnection.value) {
      currentConnection.value.abort()
    }
    
    // 准备聊天历史（排除当前刚添加的用户消息和AI消息占位符）
    const chatHistory = messages.value.slice(0, -2).map(msg => ({
      role: msg.role,
      content: msg.content
    }))
    
    const connection = createChatStream({
      message: currentInput,
      systemPrompt: '',
      modelConfigId: selectedModelId.value,
      chatHistory: chatHistory,
      sessionId: currentSessionId.value
    }, {
      onMessage: (chunk) => {
        // 实时更新AI消息内容
        console.log('Vue组件收到消息块:', chunk); // 调试信息
        
        // 尝试解析JSON，如果是会话信息等控制数据则跳过
        try {
          const parsed = JSON.parse(chunk)
          if (parsed.type === 'session' || parsed.type === 'error') {
            console.log('收到控制信息，跳过:', parsed)
            return
          }
        } catch (e) {
          // 不是JSON，继续处理为普通文本
        }
        
        console.log('当前AI消息索引:', aiMessageIndex); // 调试信息
        console.log('更新前的内容:', messages.value[aiMessageIndex].content); // 调试信息
        
        // 确保响应式更新 - 使用Vue的响应式API
        const currentMessage = messages.value[aiMessageIndex]
        if (currentMessage) {
          // 直接修改内容，Vue 3的响应式系统会自动检测
          currentMessage.content += chunk
        }
        
        console.log('更新后的内容:', messages.value[aiMessageIndex].content); // 调试信息
        
        // 立即滚动到底部，确保用户能看到新内容
        nextTick(() => {
          scrollToBottom()
        })
      },
      onToolCall: (toolName, toolInput) => {
        // 处理工具调用事件
        console.log('工具调用:', toolName, toolInput);
        const currentMessage = messages.value[aiMessageIndex]
        if (currentMessage) {
          // 添加新的工具调用记录
          const toolCallIndex = currentMessage.toolCalls.length
          const toolCall = {
            name: toolName,
            input: toolInput,
            output: null,
            status: 'calling',
            activeNames: [] // 默认不展开工具调用
          }
          currentMessage.toolCalls.push(toolCall)
        }
        
        // 滚动到底部显示工具调用
        nextTick(() => {
          scrollToBottom()
        })
      },
      onToolResult: (toolName, toolOutput) => {
        // 处理工具结果事件
        console.log('工具结果:', toolName, toolOutput);
        const currentMessage = messages.value[aiMessageIndex]
        if (currentMessage && currentMessage.toolCalls) {
          // 找到对应的工具调用并更新结果
          const toolCall = currentMessage.toolCalls.find(tc => tc.name === toolName && tc.status === 'calling')
          if (toolCall) {
            toolCall.output = toolOutput
            toolCall.status = 'completed'
          }
        }
        
        // 滚动到底部显示工具结果
        nextTick(() => {
          scrollToBottom()
        })
      },
      onError: (error) => {
        console.error('SSE连接错误:', error)
        console.log('错误发生时的AI消息内容:', messages.value[aiMessageIndex]?.content); // 调试信息
        ElMessage.error('连接错误: ' + error)
        // 移除失败的AI消息
        if (messages.value[aiMessageIndex]) {
          console.log('移除失败的AI消息'); // 调试信息
          messages.value.splice(aiMessageIndex, 1)
        }
        // 清除流式输入状态
        streamingMessageIndex.value = -1
        isLoading.value = false
        currentConnection.value = null
      },
      onComplete: async () => {
        console.log('SSE连接完成')
        console.log('完成时的AI消息内容:', messages.value[aiMessageIndex]?.content); // 调试信息
        
        // 保存AI消息到数据库
        try {
          const aiMessage = messages.value[aiMessageIndex]
          if (aiMessage && aiMessage.content && currentSessionId.value) {
            await saveAiMessage({
              sessionId: currentSessionId.value,
              messageContent: aiMessage.content,
              modelConfigId: selectedModelId.value
            })
            console.log('AI消息已保存到数据库')
          }
        } catch (error) {
          console.error('保存AI消息失败:', error)
          // 不显示错误提示，避免影响用户体验
        }
        
        // 清除流式输入状态
        streamingMessageIndex.value = -1
        // 确保最后滚动到底部
        nextTick(() => {
          scrollToBottom()
        })
        currentConnection.value = null
      }
    }, {
      maxRetries: 3,
      retryDelay: 1000
    })
    
    currentConnection.value = connection
    await connection.promise
  } catch (error) {
    console.error('发送消息失败:', error)
    console.log('catch块中的AI消息内容:', messages.value[aiMessageIndex]?.content); // 调试信息
    ElMessage.error('发送失败: ' + (error.message || '网络错误'))
    // 移除失败的AI消息
    if (messages.value[aiMessageIndex]) {
      console.log('catch块中移除失败的AI消息'); // 调试信息
      messages.value.splice(aiMessageIndex, 1)
    }
    // 清除流式输入状态
    streamingMessageIndex.value = -1
  } finally {
    isLoading.value = false
    currentConnection.value = null
    console.log('finally块执行完成'); // 调试信息
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
    
    await clearAllChatHistory()
    messages.value = []
    chatSessions.value = []
    currentSessionId.value = null
    // 创建一个新会话
    await createNewSession()
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
    if (!content || content.length === 0) return ''
    // 先用 marked 渲染为 HTML
    const rawHtml = marked.parse(content)
    // 使用 DOM 解析，避免正则重复替换导致的错误结构
    const container = document.createElement('div')
    container.innerHTML = rawHtml

    const blocks = container.querySelectorAll('pre > code')
    blocks.forEach((codeEl) => {
      const preEl = codeEl.parentElement
      if (!preEl) return
      // 幂等：如果该 pre 已经在包装器内，直接跳过
      const alreadyWrapped = preEl.closest('.code-block-wrapper')
      if (alreadyWrapped) return

      // 语言识别：从 className 中提取 language-xxx，否则为 text
      const className = codeEl.getAttribute('class') || ''
      const langMatch = className.match(/language-([\w-]+)/)
      const lang = (langMatch && langMatch[1]) ? langMatch[1] : 'text'

      // 确保应用 hljs 类以启用主题样式
      if (!/\bhljs\b/.test(className)) {
        codeEl.classList.add('hljs')
      }

      // 构造包装器与头部（语言 + 复制按钮）
      const wrapper = document.createElement('div')
      wrapper.className = 'code-block-wrapper'

      const header = document.createElement('div')
      header.className = 'code-block-header'

      const label = document.createElement('span')
      label.className = 'code-language'
      label.textContent = lang

      const btn = document.createElement('button')
      btn.className = 'copy-code-btn'
      btn.type = 'button'
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>复制'

      header.appendChild(label)
      header.appendChild(btn)

      // 用包装器替换原 pre，保持结构：wrapper(header + pre)
      preEl.replaceWith(wrapper)
      wrapper.appendChild(header)
      wrapper.appendChild(preEl)
    })

    // 兜底高亮：若某些代码块没有被 marked 的 highlight 函数处理（无 span），主动调用 hljs.highlightElement
    const codeNodes = container.querySelectorAll('pre > code')
    codeNodes.forEach((codeEl) => {
      if (!codeEl.querySelector('span')) {
        try {
          hljs.highlightElement(codeEl)
        } catch (err) {
          console.warn('兜底高亮失败:', err)
        }
      }
    })

    return container.innerHTML
  } catch (error) {
    console.warn('Markdown渲染失败:', error)
    return content
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
  }
}

// 格式化时间
const formatTime = (timestamp) => {
  const now = new Date()
  const time = new Date(timestamp)
  const diff = now - time
  
  if (diff < 60000) {
    return '刚刚'
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    return time.toLocaleDateString() + ' ' + time.toLocaleTimeString()
  }
}

// 停止当前对话
const handleStop = () => {
  if (currentConnection.value) {
    currentConnection.value.abort()
    currentConnection.value = null
  }
  
  // 重置所有相关状态
  isLoading.value = false
  streamingMessageIndex.value = -1
  
  ElMessage.info('已停止对话')
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
  flex-direction: row; /* 改为水平布局 */
  height: calc(100vh - 84px); /* 减去标签栏等上方元素的高度 */
  background: #f7f7f8;
  font-family: 'Söhne', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

/* 聊天主区域样式 */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  transition: all 0.3s ease;
  min-width: 0; /* 防止flex子项溢出 */
}

.chat-main.sidebar-collapsed {
  margin-left: 0;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  flex-shrink: 0; /* 防止头部被压缩 */
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.chat-header h2 {
  margin: 0;
  color: #111827;
  font-size: 16px;
  font-weight: 600;
}

.model-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.model-label {
  font-size: 14px;
  color: #6b7280;
  white-space: nowrap;
}

.chat-content {
  flex: 1;
  overflow-y: auto;
  background: #ffffff;
  min-height: 0; /* 确保flex子项能正确收缩 */
}

.message-list {
  display: flex;
  flex-direction: column;
  max-width: none; /* 移除最大宽度限制，让消息占满可用空间 */
  margin: 0;
  width: 100%;
  padding: 0 24px; /* 增加左右内边距 */
}

.message-item {
  width: 100%;
  padding: 24px 0;
  border-bottom: 1px solid #f0f0f0;
}

.user-message {
  background: #ffffff;
}

.ai-message {
  background: #ffffff;
}

.message-wrapper {
  display: flex;
  gap: 16px;
  width: 100%;
}

.message-avatar {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  margin-top: 4px;
}

.message-avatar :deep(.el-avatar) {
  width: 30px;
  height: 30px;
  font-size: 14px;
}

.message-content {
  flex: 1;
  min-width: 0;
  line-height: 1.75;
}

.message-text {
  font-size: 16px;
  color: #374151;
  word-wrap: break-word;
  line-height: 1.75;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  max-width: 80px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3b82f6;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.chat-input {
  padding: 20px 24px; /* 与消息区域保持一致的内边距 */
  background: #ffffff;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0; /* 防止输入区域被压缩 */
}

.chat-input-inner {
  max-width: none; /* 移除最大宽度限制 */
  margin: 0;
  position: relative;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #d1d5db;
  overflow: hidden;
}

.chat-input-inner:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.chat-input :deep(.el-textarea) {
  display: flex;
  align-items: flex-end;
}

.chat-input :deep(.el-textarea__inner) {
  border: none;
  box-shadow: none;
  background-color: transparent;
  padding: 16px 60px 16px 16px;
  resize: none;
  font-size: 16px;
  line-height: 1.5;
  color: #374151;
  min-height: 52px;
  max-height: 200px;
}

.chat-input :deep(.el-textarea__inner):focus {
  box-shadow: none;
}

.chat-input :deep(.el-textarea__inner)::placeholder {
  color: #9ca3af;
}

.input-actions {
  position: absolute;
  right: 8px;
  bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-actions .el-button {
  border-radius: 6px;
  font-weight: 500;
  font-size: 14px;
  padding: 8px 16px;
  height: auto;
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.input-actions .el-button--danger {
  background-color: #ef4444;
  border-color: #ef4444;
}

.input-actions .el-button--danger:hover {
  background-color: #dc2626;
  border-color: #dc2626;
}

.input-actions .el-button--primary {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

.input-actions .el-button--primary:hover {
  background-color: #2563eb;
  border-color: #2563eb;
}

.input-actions .el-button--primary.send-button-disabled {
  background-color: #9ca3af;
  border-color: #9ca3af;
}

.input-actions .el-button--primary.send-button-disabled:hover {
  background-color: #6b7280;
  border-color: #6b7280;
}

/* 滚动条样式 */
.chat-content::-webkit-scrollbar {
  width: 8px;
}

.chat-content::-webkit-scrollbar-track {
  background: transparent;
}

.chat-content::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

.chat-content::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* Markdown 样式 */
.message-text :deep(p) {
  margin: 0 0 16px 0;
}

.message-text :deep(p:last-child) {
  margin-bottom: 0;
}

.message-text :deep(pre) {
  background: #1e1e1e;
  color: #ffffff;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 16px 0;
  position: relative;
}

.message-text :deep(code) {
  font-family: 'Söhne Mono', Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
}

.message-text :deep(pre code) {
  background: transparent;
  padding: 0;
  color: inherit;
}

.message-text :deep(p code) {
  background: rgba(175, 184, 193, 0.2);
  color: #374151;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
}

.message-text :deep(ul),
.message-text :deep(ol) {
  margin: 16px 0;
  padding-left: 24px;
}

.message-text :deep(li) {
  margin: 8px 0;
}

.message-text :deep(blockquote) {
  border-left: 3px solid #d1d5db;
  padding-left: 16px;
  margin: 16px 0;
  color: #6b7280;
}

.message-text :deep(h1),
.message-text :deep(h2),
.message-text :deep(h3),
.message-text :deep(h4) {
  margin: 24px 0 16px 0;
  font-weight: 600;
  color: #111827;
}

.message-text :deep(h1) { font-size: 1.5em; }
.message-text :deep(h2) { font-size: 1.3em; }
.message-text :deep(h3) { font-size: 1.1em; }

.message-text :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 16px 0;
}

.message-text :deep(table th),
.message-text :deep(table td) {
  border: 1px solid #e5e7eb;
  padding: 8px 12px;
  text-align: left;
}

.message-text :deep(table th) {
  background: #f9fafb;
  font-weight: 600;
}

.message-text :deep(a) {
  color: #3b82f6;
  text-decoration: none;
}

.message-text :deep(a:hover) {
  text-decoration: underline;
}

/* 代码高亮样式增强 */
.message-text :deep(.hljs) {
  background: #1e1e1e !important;
  color: #d4d4d4 !important;
  border-radius: 8px;
  padding: 16px;
  overflow-x: auto;
  font-size: 14px;
  line-height: 1.5;
}

.message-text :deep(.hljs-keyword) {
  color: #569cd6 !important;
}

.message-text :deep(.hljs-string) {
  color: #ce9178 !important;
}

.message-text :deep(.hljs-comment) {
  color: #6a9955 !important;
}

.message-text :deep(.hljs-number) {
  color: #b5cea8 !important;
}

.message-text :deep(.hljs-function) {
  color: #dcdcaa !important;
}

.message-text :deep(.hljs-variable) {
  color: #9cdcfe !important;
}

/* 流式输入光标样式 */
.typing-cursor {
  display: none;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* 代码块包装器样式 */
.message-text :deep(.code-block-wrapper) {
  margin: 16px 0;
  border-radius: 8px;
  overflow: hidden;
  background: #1e1e1e;
  border: 1px solid #333;
}

.message-text :deep(.code-block-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #2d2d2d;
  border-bottom: 1px solid #333;
}

.message-text :deep(.code-language) {
  font-size: 12px;
  color: #888;
  text-transform: uppercase;
  font-weight: 500;
}

.message-text :deep(.copy-code-btn) {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: transparent;
  border: 1px solid #555;
  border-radius: 4px;
  color: #ccc;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.message-text :deep(.copy-code-btn:hover) {
  background: #404040;
  border-color: #666;
  color: #fff;
}

.message-text :deep(.copy-code-btn svg) {
  width: 14px;
  height: 14px;
}

.message-text :deep(.code-block-wrapper pre) {
  margin: 0;
  background: #1e1e1e !important;
  border-radius: 0;
}

/* 消息操作按钮样式 */
.message-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.message-wrapper:hover .message-actions {
  opacity: 1;
}

.copy-message-btn {
  color: #6b7280 !important;
  padding: 4px 8px !important;
  font-size: 12px !important;
  border-radius: 4px !important;
  background: transparent !important;
  border: 1px solid transparent !important;
}

.copy-message-btn:hover {
  color: #1e40af !important;
  background: rgba(30, 64, 175, 0.1) !important;
  border-color: rgba(30, 64, 175, 0.2) !important;
}

/* 工具调用样式 */
.tool-calls-section {
  margin-bottom: 16px;
}

.tool-call-item {
  margin-bottom: 12px;
}

.tool-call-collapse {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.tool-call-collapse :deep(.el-collapse-item__header) {
  background-color: #f8f9fa;
  padding: 12px 16px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-weight: 500;
}

.tool-call-collapse :deep(.el-collapse-item__header):hover {
  background-color: #f0f2f5;
}

.tool-call-collapse :deep(.el-collapse-item__content) {
  padding: 0;
  border: none;
}

.tool-call-header {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.tool-icon {
  color: #3b82f6;
  font-size: 16px;
}

.tool-name {
  font-weight: 500;
  color: #374151;
  flex: 1;
}

.tool-status {
  margin-left: auto;
  font-weight: 500;
}

.tool-call-content {
  padding: 16px;
  background-color: #fafafa;
  border-top: 1px solid #e4e7ed;
}

.tool-section-title {
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 8px;
}

.tool-input {
  margin-bottom: 16px;
}

.tool-output {
  margin-bottom: 0;
}

.tool-data {
  background-color: #f5f5f5;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 12px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.4;
  color: #374151;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
  margin: 0;
}

/* 会话管理侧边栏样式 */
.chat-sidebar {
  width: 280px;
  background-color: #f8f9fa;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.chat-sidebar.sidebar-collapsed {
  width: 0;
  overflow: hidden;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sidebar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.empty-sessions {
  padding: 20px;
  text-align: center;
}

.session-item {
  padding: 12px 16px;
  margin-bottom: 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.session-item:hover {
  background-color: #e5e7eb;
}

.session-item.active {
  background-color: #3b82f6;
  color: white;
  border-color: #2563eb;
}

.session-item.active:hover {
  background-color: #2563eb;
}

.session-content {
  flex: 1;
  min-width: 0;
}

.session-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-time {
  font-size: 12px;
  opacity: 0.7;
}

.session-item .session-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
  flex-shrink: 0;
}

.session-item:hover .session-actions {
  opacity: 1;
}

.session-item.active .session-actions {
  opacity: 1;
}

.action-btn {
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.action-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.sidebar-toggle {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 10;
  background-color: white;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 8px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.sidebar-toggle:hover {
  background-color: #f3f4f6;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* 响应式布局 */
@media (max-width: 768px) {
  .chat-sidebar {
    width: 260px; /* 在小屏幕上稍微减小侧边栏宽度 */
  }
  
  .message-list {
    padding: 0 16px; /* 在小屏幕上减少内边距 */
  }
  
  .chat-input {
    padding: 16px; /* 在小屏幕上减少内边距 */
  }
}

@media (max-width: 480px) {
  .chat-sidebar {
    width: 240px; /* 在更小的屏幕上进一步减小侧边栏宽度 */
  }
  
  .sidebar-header {
    padding: 12px; /* 减少头部内边距 */
  }
  
  .session-list {
    padding: 4px; /* 减少会话列表内边距 */
  }
  
  .session-item {
    padding: 8px 12px; /* 减少会话项内边距 */
  }
}

/* 深色主题下的工具调用样式 */
@media (prefers-color-scheme: dark) {
  .tool-call-collapse {
    border-color: #4c4d4f;
  }
  
  .tool-call-collapse :deep(.el-collapse-item__header) {
    background-color: #2b2b2b;
  }
  
  .tool-call-collapse :deep(.el-collapse-item__header):hover {
    background-color: #363637;
  }
  
  .tool-name {
    color: #e4e7ed;
  }
  
  .tool-call-content {
    background-color: #1d1e1f;
  }
  
  .tool-section-title {
    color: #a8abb2;
  }
  
  .tool-data {
    background-color: #262727;
    border-color: #4c4d4f;
    color: #e4e7ed;
  }
}
</style>