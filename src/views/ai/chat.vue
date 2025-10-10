<template>
  <div class="ai-chat-container">
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
          <el-button 
            type="success" 
            size="small" 
            @click="openQuickAddDialog"
            style="margin-left: 8px;"
            :icon="Plus"
          >
            快速新增
          </el-button>
        </div>
      </div>
      <div>
        <el-button type="primary" size="small" @click="openModelConfigDialog">模型配置</el-button>
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
              <div class="message-text" v-html="formatMessage(message.content)"></div>
              <!-- 流式输入光标 -->
              <span v-if="index === streamingMessageIndex" class="typing-cursor">|</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 加载状态 -->
      <div v-if="isLoading" class="message-item ai-message">
        <div class="message-wrapper">
          <div class="message-avatar">
            <el-avatar background-color="#10a37f">
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
          :rows="3"
          placeholder="请输入您的问题..."
          @keydown.enter.prevent="handleSend"
          :disabled="isLoading"
        />
        <div class="input-actions">
          <el-button 
            v-if="isLoading && currentConnection" 
            type="danger" 
            @click="handleStop"
            size="small"
          >
            停止
          </el-button>
          <el-button 
            type="primary" 
            @click="handleSend" 
            :loading="isLoading"
            :disabled="isLoading"
          >
            发送
          </el-button>
        </div>
      </div>
    </div>
    
    <!-- 模型配置弹窗 -->
    <el-dialog v-model="modelConfigDialogVisible" title="模型配置管理" width="900px">
      <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
        <div style="display:flex; gap:8px;">
          <el-input v-model="queryParams.provider" placeholder="提供商" clearable style="width:160px;" />
          <el-input v-model="queryParams.capability" placeholder="能力 (chat,embedding...)" clearable style="width:200px;" />
          <el-input v-model="queryParams.model" placeholder="模型名称" clearable style="width:200px;" />
          <el-select v-model="queryParams.enabled" placeholder="是否启用" clearable style="width:140px;">
            <el-option :value="1" label="启用" />
            <el-option :value="0" label="禁用" />
          </el-select>
        </div>
        <div style="display:flex; gap:8px;">
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
          <el-button type="success" @click="handleAdd">新增</el-button>
        </div>
      </div>
      <el-table :data="modelConfigList" border height="420">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="provider" label="提供商" width="140" />
        <el-table-column prop="capability" label="能力" width="140" />
        <el-table-column prop="model" label="模型" width="180" />
        <el-table-column prop="endpoint" label="Endpoint" min-width="180" show-overflow-tooltip />
        <el-table-column prop="enabled" label="启用" width="90">
          <template #default="scope">
            <el-tag :type="scope.row.enabled ? 'success' : 'info'">{{ scope.row.enabled ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isDefault" label="默认" width="90">
          <template #default="scope">
            <el-tag :type="scope.row.isDefault === 'Y' ? 'warning' : 'info'">{{ scope.row.isDefault === 'Y' ? '默认' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="display:flex; justify-content:flex-end; margin-top:10px;">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="total"
          :page-size="queryParams.pageSize"
          :current-page="queryParams.pageNum"
          @current-change="handlePageChange"
        />
      </div>
    </el-dialog>

    <!-- 新增/编辑表单弹窗 -->
    <el-dialog v-model="formDialogVisible" :title="formTitle" width="700px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="提供商" prop="provider">
          <el-input v-model="form.provider" placeholder="如 openai, doubao..." />
        </el-form-item>
        <el-form-item label="能力" prop="capability">
          <el-input v-model="form.capability" placeholder="如 chat, embedding..." />
        </el-form-item>
        <el-form-item label="模型" prop="model">
          <el-input v-model="form.model" placeholder="模型名" />
        </el-form-item>
        <el-form-item label="API Key" prop="apiKey">
          <el-input v-model="form.apiKey" type="textarea" :rows="2" placeholder="密钥" />
        </el-form-item>
        <el-form-item label="Endpoint" prop="endpoint">
          <el-input v-model="form.endpoint" placeholder="接口地址" />
        </el-form-item>
        <el-form-item label="扩展参数" prop="extraParams">
          <el-input v-model="form.extraParams" type="textarea" :rows="3" placeholder="JSON 字符串" />
        </el-form-item>
        <el-form-item label="启用" prop="enabled">
          <el-switch v-model="form.enabled" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择">
            <el-option :value="0" label="正常" />
            <el-option :value="1" label="停用" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="formDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 快速新增模型对话框 -->
    <el-dialog v-model="quickAddDialogVisible" title="快速新增聊天模型" width="500px">
      <el-form :model="quickAddForm" :rules="quickAddRules" ref="quickAddFormRef" label-width="100px">
        <el-form-item label="提供商" prop="provider">
          <el-select v-model="quickAddForm.provider" placeholder="选择提供商" style="width: 100%;">
            <el-option value="openai" label="OpenAI" />
            <el-option value="doubao" label="豆包" />
            <el-option value="deepseek" label="DeepSeek" />
            <el-option value="qianwen" label="千问" />
            <el-option value="glm" label="智谱GLM" />
            <el-option value="oneapi" label="OneAPI" />
          </el-select>
        </el-form-item>
        <el-form-item label="模型名称" prop="model">
          <el-input v-model="quickAddForm.model" placeholder="如: gpt-3.5-turbo" />
        </el-form-item>
        <el-form-item label="API Key" prop="apiKey">
          <el-input v-model="quickAddForm.apiKey" type="password" placeholder="请输入API密钥" show-password />
        </el-form-item>
        <el-form-item label="API端点" prop="endpoint">
          <el-input v-model="quickAddForm.endpoint" placeholder="如: https://api.openai.com/v1" />
        </el-form-item>
        <el-form-item label="设为默认">
          <el-switch v-model="quickAddForm.setAsDefault" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="quickAddDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitQuickAdd" :loading="quickAddLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { clearChatHistory, createChatStream, getChatHistory, getAvailableChatModels } from '@/api/ai/chat'
import { addModelConfig, delModelConfig, getModelConfig, listModelConfigs, updateModelConfig } from '@/api/ai/modelConfig'
import { ChatDotRound, UserFilled, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { nextTick, onMounted, ref } from 'vue'

// 响应式数据
const messages = ref([])
const inputMessage = ref('')
const isLoading = ref(false)
const chatContent = ref(null)
const currentConnection = ref(null)
const streamingMessageIndex = ref(-1) // 正在流式输入的消息索引

// 聊天模型相关
const chatModels = ref([])
const selectedModelId = ref(null)

// 模型配置管理相关
const modelConfigDialogVisible = ref(false)
const formDialogVisible = ref(false)
const formTitle = ref('新增模型配置')
const formRef = ref()
const modelConfigList = ref([])
const total = ref(0)
const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  provider: undefined,
  capability: undefined,
  model: undefined,
  enabled: undefined,
})
const form = ref({
  id: undefined,
  provider: '',
  capability: '',
  model: '',
  apiKey: '',
  endpoint: '',
  extraParams: '',
  enabled: true,
  status: 0,
})
const rules = {
  provider: [{ required: true, message: '请输入提供商', trigger: 'blur' }],
  capability: [{ required: true, message: '请输入能力', trigger: 'blur' }],
  model: [{ required: true, message: '请输入模型', trigger: 'blur' }],
}

// 快速新增模型相关
const quickAddDialogVisible = ref(false)
const quickAddFormRef = ref()
const quickAddLoading = ref(false)
const quickAddForm = ref({
  provider: '',
  model: '',
  apiKey: '',
  endpoint: '',
  setAsDefault: false
})
const quickAddRules = {
  provider: [{ required: true, message: '请选择提供商', trigger: 'change' }],
  model: [{ required: true, message: '请输入模型名称', trigger: 'blur' }],
  apiKey: [{ required: true, message: '请输入API密钥', trigger: 'blur' }],
  endpoint: [{ required: true, message: '请输入API端点', trigger: 'blur' }],
}

// 组件挂载时加载历史记录和模型列表
onMounted(() => {
  loadChatHistory()
  loadChatModels()
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
    timestamp: new Date()
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
    
    const connection = createChatStream({
      message: currentInput,
      systemPrompt: '',
      modelConfigId: selectedModelId.value
    }, {
      onMessage: (chunk) => {
        // 实时更新AI消息内容
        console.log('Vue组件收到消息块:', chunk); // 调试信息
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
      onComplete: () => {
        console.log('SSE连接完成')
        console.log('完成时的AI消息内容:', messages.value[aiMessageIndex]?.content); // 调试信息
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
    // 对于流式内容，先进行简单的换行处理，避免频繁的Markdown解析
    if (!content || content.length === 0) {
      return ''
    }
    
    // 简单的文本格式化，避免复杂的Markdown解析影响性能
    return content
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
  } catch (error) {
    return content
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
    isLoading.value = false
    ElMessage.info('已停止对话')
  }
}

// -------- 模型配置管理逻辑 --------
const openModelConfigDialog = async () => {
  modelConfigDialogVisible.value = true
  await fetchModelConfigs()
}

const fetchModelConfigs = async () => {
  try {
    const res = await listModelConfigs(queryParams.value)
    if (res.code === 200) {
      modelConfigList.value = res.rows || res.data || []
      total.value = res.total || (res.data ? res.data.length : 0)
    }
  } catch (e) {
    console.error('加载模型配置失败', e)
    ElMessage.error('加载模型配置失败')
  }
}

const handleQuery = async () => {
  queryParams.value.pageNum = 1
  await fetchModelConfigs()
}

const resetQuery = async () => {
  queryParams.value = {
    pageNum: 1,
    pageSize: 10,
    provider: undefined,
    capability: undefined,
    model: undefined,
    enabled: undefined,
  }
  await fetchModelConfigs()
}

const handlePageChange = async (page) => {
  queryParams.value.pageNum = page
  await fetchModelConfigs()
}

const handleAdd = () => {
  formTitle.value = '新增模型配置'
  form.value = {
    id: undefined,
    provider: '',
    capability: '',
    model: '',
    apiKey: '',
    endpoint: '',
    extraParams: '',
    enabled: true,
    status: 0,
  }
  formDialogVisible.value = true
}

const normalizeConfig = (data) => {
  const enabledVal = data?.enabled
  const statusVal = data?.status
  return {
    ...data,
    enabled: enabledVal === 'Y' || enabledVal === 'y' || enabledVal === 1 || enabledVal === true,
    status: typeof statusVal === 'string' ? Number(statusVal) : (statusVal ?? 0)
  }
}

const handleEdit = async (row) => {
  formTitle.value = '编辑模型配置'
  // 先用行数据预填并打开弹窗，提升交互体验
  form.value = normalizeConfig(row || {})
  formDialogVisible.value = true
  try {
    const res = await getModelConfig(row.id)
    if (res.code === 200 && res.data) {
      form.value = normalizeConfig(res.data)
    }
  } catch (e) {
    console.error('获取模型配置详情失败', e)
    ElMessage.warning('无法获取详情，已使用列表数据预填')
  }
}

const submitForm = async () => {
  try {
    await formRef.value.validate()
    const payload = { ...form.value }
    // 处理 extraParams 为字符串或对象
    if (typeof payload.extraParams === 'string' && payload.extraParams.trim()) {
      try {
        JSON.parse(payload.extraParams)
      } catch (_) {}
    }
    // 类型规范化：enabled -> 'Y'/'N'；status 统一字符串
    payload.enabled = payload.enabled ? 'Y' : 'N'
    payload.status = typeof payload.status === 'number' ? String(payload.status) : (payload.status ?? '0')

    let res
    if (payload.id) {
      res = await updateModelConfig(payload)
    } else {
      res = await addModelConfig(payload)
    }
    if (res.code === 200) {
      ElMessage.success('保存成功')
      formDialogVisible.value = false
      await fetchModelConfigs()
    } else {
      ElMessage.error(res.msg || '保存失败')
    }
  } catch (e) {
    if (e) {
      console.error('保存模型配置失败', e)
      ElMessage.error('保存失败')
    }
  }
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除该配置吗？', '提示', { type: 'warning' })
    const res = await delModelConfig(id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      await fetchModelConfigs()
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch (e) {
    if (e !== 'cancel') {
      console.error('删除模型配置失败', e)
      ElMessage.error('删除失败')
    }
  }
}

// 快速新增模型相关方法
const openQuickAddDialog = () => {
  // 重置表单
  quickAddForm.value = {
    provider: '',
    model: '',
    apiKey: '',
    endpoint: '',
    setAsDefault: false
  }
  quickAddDialogVisible.value = true
}

const submitQuickAdd = async () => {
  try {
    await quickAddFormRef.value.validate()
    quickAddLoading.value = true
    
    // 构建新增模型的数据
    const modelData = {
      provider: quickAddForm.value.provider,
      capability: 'chat', // 快速新增默认为聊天模型
      model: quickAddForm.value.model,
      apiKey: quickAddForm.value.apiKey,
      endpoint: quickAddForm.value.endpoint,
      extraParams: JSON.stringify({
        temperature: 0.7,
        maxTokens: 4096
      }),
      enabled: 'Y',
      status: '0',
      isDefault: quickAddForm.value.setAsDefault ? 'Y' : 'N',
      remark: `快速新增的${quickAddForm.value.provider}聊天模型`
    }
    
    const res = await addModelConfig(modelData)
    if (res.code === 200) {
      ElMessage.success('模型新增成功')
      quickAddDialogVisible.value = false
      
      // 刷新聊天模型列表
      await loadChatModels()
      
      // 如果设置为默认，选中新添加的模型
      if (quickAddForm.value.setAsDefault && res.data && res.data.id) {
        selectedModelId.value = res.data.id
        ElMessage.success('已自动选择新添加的模型')
      } else if (res.data && res.data.id) {
        // 即使不设为默认，也选中新添加的模型
        selectedModelId.value = res.data.id
        ElMessage.success('已自动选择新添加的模型')
      }
    } else {
      ElMessage.error(res.msg || '新增失败')
    }
  } catch (e) {
    if (e) {
      console.error('快速新增模型失败', e)
      ElMessage.error('新增失败')
    }
  } finally {
    quickAddLoading.value = false
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
  padding: 16px 24px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.chat-header h2 {
  margin: 0;
  color: #111827;
  font-size: 18px;
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
}

.message-list {
  display: flex;
  flex-direction: column;
}

.message-item {
  width: 100%;
  border-bottom: 1px solid #f0f0f0;
}

.user-message {
  background: #ffffff;
}

.ai-message {
  background: #f7f7f8;
}

.message-wrapper {
  display: flex;
  gap: 24px;
  max-width: 860px;
  margin: 0 auto;
  padding: 24px;
}

.message-avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
}

.message-avatar :deep(.el-avatar) {
  width: 32px;
  height: 32px;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-text {
  line-height: 1.75;
  word-wrap: break-word;
  font-size: 15px;
  color: #111827;
}

.typing-indicator {
  display: flex;
  gap: 6px;
  padding: 8px 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10a37f;
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
    transform: scale(0);
    opacity: 0.5;
  }
  40% { 
    transform: scale(1);
    opacity: 1;
  }
}

.chat-input {
  padding: 24px;
  background: #ffffff;
  border-top: 1px solid #e5e7eb;
}

.chat-input-inner {
  max-width: 860px;
  margin: 0 auto;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  padding: 12px;
  background: #ffffff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05);
}

.chat-input-inner:focus-within {
  border-color: #10a37f;
  box-shadow: 0 0 0 3px rgba(16, 163, 127, 0.1);
}

.chat-input :deep(.el-textarea__inner) {
  border: none;
  box-shadow: none;
  background-color: transparent;
  padding: 8px;
  resize: none;
}

.chat-input :deep(.el-textarea__inner):focus {
  box-shadow: none;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.input-actions .el-button {
  border-radius: 8px;
  padding: 10px 20px;
  background: #10a37f;
  border-color: #10a37f;
}

.input-actions .el-button:hover {
  background: #0d8c6c;
  border-color: #0d8c6c;
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
  margin: 0 0 12px 0;
}

.message-text :deep(p:last-child) {
  margin-bottom: 0;
}

.message-text :deep(pre) {
  background: #000000;
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
  background: rgba(0, 0, 0, 0.05);
  color: #111827;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
}

.message-text :deep(ul),
.message-text :deep(ol) {
  margin: 12px 0;
  padding-left: 24px;
}

.message-text :deep(li) {
  margin: 6px 0;
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
  margin: 20px 0 12px 0;
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
  color: #10a37f;
  text-decoration: none;
}

.message-text :deep(a:hover) {
  text-decoration: underline;
}

/* 打字机光标效果 */
.typing-cursor {
  display: inline-block;
  color: #10a37f;
  font-weight: bold;
  animation: blink 1s infinite;
  margin-left: 2px;
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}
</style>