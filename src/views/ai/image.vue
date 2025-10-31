<template>
  <div class="ai-image-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>AI 图片生成</h2>
      <p class="page-description">使用阿里云通义万相模型生成高质量图片</p>
    </div>

    <!-- 生成表单 -->
    <div class="generation-form">
      <el-card shadow="hover">
        <template #header>
          <div class="card-header">
            <span>生成参数</span>
          </div>
        </template>
        
        <el-form 
          ref="formRef" 
          :model="form" 
          :rules="rules" 
          label-width="100px"
          @submit.prevent="handleGenerate"
        >
          <el-form-item label="提示词" prop="prompt">
            <el-input
              v-model="form.prompt"
              type="textarea"
              :rows="4"
              placeholder="请输入图片描述，例如：一副典雅庄重的对联悬挂于厅堂之中"
              maxlength="500"
              show-word-limit
              :disabled="isGenerating"
            />
          </el-form-item>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="模型" prop="model">
                <el-select 
                  v-model="form.model" 
                  placeholder="选择生成模型"
                  style="width: 100%"
                  :disabled="isGenerating"
                >
                  <el-option
                    v-for="(label, value) in supportedModels"
                    :key="value"
                    :label="label"
                    :value="value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            
            <el-col :span="12">
              <el-form-item label="图片尺寸" prop="size">
                <el-select 
                  v-model="form.size" 
                  placeholder="选择图片尺寸"
                  style="width: 100%"
                  :disabled="isGenerating"
                >
                  <el-option
                    v-for="size in supportedSizes"
                    :key="size"
                    :label="size"
                    :value="size"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="生成数量" prop="n">
                <el-select 
                  v-model="form.n" 
                  placeholder="选择生成数量"
                  style="width: 100%"
                  :disabled="isGenerating"
                >
                  <el-option label="1张" :value="1" />
                  <el-option label="2张" :value="2" />
                  <el-option label="3张" :value="3" />
                  <el-option label="4张" :value="4" />
                </el-select>
              </el-form-item>
            </el-col>
            
            <el-col :span="12">
              <el-form-item label="高级选项">
                <div class="advanced-options">
                  <el-checkbox 
                    v-model="form.promptExtend" 
                    :disabled="isGenerating"
                  >
                    扩展提示词
                  </el-checkbox>
                  <el-checkbox 
                    v-model="form.watermark" 
                    :disabled="isGenerating"
                  >
                    添加水印
                  </el-checkbox>
                </div>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item>
            <el-button 
              type="primary" 
              @click="handleGenerate"
              :loading="isGenerating"
              :disabled="isGenerating"
              size="large"
            >
              <el-icon><Picture /></el-icon>
              {{ isGenerating ? '生成中...' : '生成图片' }}
            </el-button>
            
            <el-button 
              @click="resetForm"
              :disabled="isGenerating"
              size="large"
            >
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 生成进度 -->
    <div v-if="isGenerating" class="generation-progress">
      <el-card shadow="hover">
        <div class="progress-content">
          <el-icon class="loading-icon"><Loading /></el-icon>
          <div class="progress-text">
            <h3>正在生成图片...</h3>
            <p>请稍候，AI正在根据您的描述创作图片</p>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 生成结果 -->
    <div v-if="generatedImages.length > 0" class="generation-results">
      <el-card shadow="hover">
        <template #header>
          <div class="card-header">
            <span>生成结果 ({{ generatedImages.length }}张)</span>
            <div class="result-actions">
              <el-button 
                type="primary" 
                size="small" 
                @click="downloadAllImages"
                :icon="Download"
              >
                下载全部
              </el-button>
              <el-button 
                size="small" 
                @click="clearResults"
                :icon="Delete"
              >
                清空结果
              </el-button>
            </div>
          </div>
        </template>
        
        <div class="image-grid">
          <div 
            v-for="(image, index) in generatedImages" 
            :key="index"
            class="image-item"
          >
            <div class="image-wrapper">
              <el-image
                :src="image.url"
                :preview-src-list="generatedImages.map(img => img.url)"
                :initial-index="index"
                fit="cover"
                class="generated-image"
                :preview-teleported="true"
              >
                <template #error>
                  <div class="image-error">
                    <el-icon><Picture /></el-icon>
                    <span>加载失败</span>
                  </div>
                </template>
              </el-image>
              
              <div class="image-overlay">
                <div class="image-actions">
                  <el-button 
                    type="primary" 
                    size="small" 
                    circle
                    @click="previewImage(index)"
                    :icon="ZoomIn"
                    title="预览"
                  />
                  <el-button 
                    type="success" 
                    size="small" 
                    circle
                    @click="downloadImage(image.url, index)"
                    :icon="Download"
                    title="下载"
                  />
                  <el-button 
                    type="info" 
                    size="small" 
                    circle
                    @click="copyImageUrl(image.url)"
                    :icon="Link"
                    title="复制链接"
                  />
                </div>
              </div>
            </div>
            
            <div class="image-info">
              <p class="image-prompt">{{ image.prompt }}</p>
              <p class="image-meta">
                {{ image.model }} · {{ image.size }} · {{ formatTime(image.timestamp) }}
              </p>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 历史记录 -->
    <div v-if="historyImages.length > 0" class="history-section">
      <el-card shadow="hover">
        <template #header>
          <div class="card-header">
            <span>历史记录</span>
            <el-button 
              size="small" 
              @click="clearHistory"
              :icon="Delete"
            >
              清空历史
            </el-button>
          </div>
        </template>
        
        <div class="history-grid">
          <div 
            v-for="(image, index) in historyImages" 
            :key="index"
            class="history-item"
            @click="loadHistoryToForm(image)"
          >
            <el-image
              :src="image.url"
              fit="cover"
              class="history-image"
            >
              <template #error>
                <div class="image-error">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
            <div class="history-info">
              <p class="history-prompt">{{ image.prompt.substring(0, 30) }}...</p>
              <p class="history-time">{{ formatTime(image.timestamp) }}</p>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { generateImage, getSupportedModels, getSupportedSizes } from '@/api/ai/image'
import { Delete, Download, Link, Loading, Picture, ZoomIn } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { nextTick, onMounted, ref } from 'vue'

// 响应式数据
const formRef = ref()
const isGenerating = ref(false)
const supportedModels = ref({})
const supportedSizes = ref([])
const generatedImages = ref([])
const historyImages = ref([])

// 表单数据
const form = ref({
  prompt: '',
  model: 'qwen-image-plus',
  size: '1328*1328',
  n: 1,
  promptExtend: true,
  watermark: true
})

// 表单验证规则
const rules = {
  prompt: [
    { required: true, message: '请输入图片描述', trigger: 'blur' },
    { min: 5, message: '描述至少需要5个字符', trigger: 'blur' },
    { max: 500, message: '描述不能超过500个字符', trigger: 'blur' }
  ],
  model: [
    { required: true, message: '请选择生成模型', trigger: 'change' }
  ],
  size: [
    { required: true, message: '请选择图片尺寸', trigger: 'change' }
  ],
  n: [
    { required: true, message: '请选择生成数量', trigger: 'change' }
  ]
}

// 组件挂载时加载配置
onMounted(() => {
  loadSupportedModels()
  loadSupportedSizes()
  loadHistoryFromStorage()
})

// 加载支持的模型列表
const loadSupportedModels = async () => {
  try {
    const response = await getSupportedModels()
    // 根据request.js的处理逻辑，成功时直接返回data部分
    supportedModels.value = response
  } catch (error) {
    console.error('加载模型列表失败:', error)
    ElMessage.error('加载模型列表失败')
  }
}

// 加载支持的尺寸列表
const loadSupportedSizes = async () => {
  try {
    const response = await getSupportedSizes()
    // 根据request.js的处理逻辑，成功时直接返回data部分
    if (response && response.sizes) {
      supportedSizes.value = response.sizes
      // 设置默认尺寸
      if (response.default) {
        form.value.size = response.default
      }
    }
  } catch (error) {
    console.error('加载尺寸列表失败:', error)
    ElMessage.error('加载尺寸列表失败')
  }
}

// 生成图片
const handleGenerate = async () => {
  try {
    // 表单验证
    await formRef.value.validate()
    
    isGenerating.value = true
    
    // 调用API生成图片
    const response = await generateImage(form.value)
    
    // 根据request.js的处理逻辑，成功时直接返回data部分
    // 如果有错误，会在request.js中被拦截并抛出异常
    const result = response
    
    // 处理生成结果
    if (result && result.images && Array.isArray(result.images)) {
      const newImages = result.images.map(url => ({
        url,
        prompt: form.value.prompt,
        model: form.value.model,
        size: form.value.size,
        timestamp: new Date()
      }))
      
      // 添加到结果列表
      generatedImages.value = newImages
      
      // 添加到历史记录
      historyImages.value.unshift(...newImages)
      
      // 保存历史记录到本地存储
      saveHistoryToStorage()
      
      ElMessage.success(`成功生成 ${result.count || newImages.length} 张图片`)
      
      // 滚动到结果区域
      await nextTick()
      scrollToResults()
    } else {
      ElMessage.error('生成图片失败：返回数据格式错误')
    }
    
  } catch (error) {
    console.error('生成图片失败:', error)
    ElMessage.error('生成图片失败: ' + (error.message || '未知错误'))
  } finally {
    isGenerating.value = false
  }
}

// 重置表单
const resetForm = () => {
  formRef.value.resetFields()
  form.value = {
    prompt: '',
    model: 'qwen-image-plus',
    size: '1328*1328',
    n: 1,
    promptExtend: true,
    watermark: true
  }
}

// 预览图片
const previewImage = (index) => {
  // Element Plus 的 el-image 组件会自动处理预览
}

// 下载单张图片
const downloadImage = async (url, index) => {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `ai-image-${Date.now()}-${index + 1}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    window.URL.revokeObjectURL(downloadUrl)
    ElMessage.success('图片下载成功')
  } catch (error) {
    console.error('下载图片失败:', error)
    ElMessage.error('下载图片失败')
  }
}

// 下载全部图片
const downloadAllImages = async () => {
  for (let i = 0; i < generatedImages.value.length; i++) {
    await downloadImage(generatedImages.value[i].url, i)
    // 添加延迟避免浏览器阻止多个下载
    if (i < generatedImages.value.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
}

// 复制图片链接
const copyImageUrl = async (url) => {
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('图片链接已复制到剪贴板')
  } catch (error) {
    console.error('复制链接失败:', error)
    ElMessage.error('复制链接失败')
  }
}

// 清空结果
const clearResults = () => {
  generatedImages.value = []
  ElMessage.success('已清空生成结果')
}

// 清空历史记录
const clearHistory = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有历史记录吗？此操作不可恢复。',
      '确认清空',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    historyImages.value = []
    localStorage.removeItem('ai-image-history')
    ElMessage.success('历史记录已清空')
  } catch (error) {
    // 用户取消操作
  }
}

// 从历史记录加载到表单
const loadHistoryToForm = (image) => {
  form.value.prompt = image.prompt
  form.value.model = image.model
  form.value.size = image.size
  ElMessage.success('已加载历史参数到表单')
}

// 滚动到结果区域
const scrollToResults = () => {
  const resultsElement = document.querySelector('.generation-results')
  if (resultsElement) {
    resultsElement.scrollIntoView({ behavior: 'smooth' })
  }
}

// 格式化时间
const formatTime = (date) => {
  if (!date) return ''
  const now = new Date()
  const diff = now - new Date(date)
  
  if (diff < 60000) { // 1分钟内
    return '刚刚'
  } else if (diff < 3600000) { // 1小时内
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) { // 1天内
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    return new Date(date).toLocaleDateString()
  }
}

// 保存历史记录到本地存储
const saveHistoryToStorage = () => {
  try {
    // 只保存最近50条记录
    const historyToSave = historyImages.value.slice(0, 50)
    localStorage.setItem('ai-image-history', JSON.stringify(historyToSave))
  } catch (error) {
    console.error('保存历史记录失败:', error)
  }
}

// 从本地存储加载历史记录
const loadHistoryFromStorage = () => {
  try {
    const saved = localStorage.getItem('ai-image-history')
    if (saved) {
      historyImages.value = JSON.parse(saved)
    }
  } catch (error) {
    console.error('加载历史记录失败:', error)
  }
}
</script>

<style scoped>
.ai-image-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h2 {
  color: #303133;
  margin-bottom: 10px;
}

.page-description {
  color: #606266;
  font-size: 14px;
}

.generation-form {
  margin-bottom: 30px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.advanced-options {
  display: flex;
  gap: 20px;
}

.generation-progress {
  margin-bottom: 30px;
}

.progress-content {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
}

.loading-icon {
  font-size: 48px;
  color: #409eff;
  margin-right: 20px;
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.progress-text h3 {
  margin: 0 0 10px 0;
  color: #303133;
}

.progress-text p {
  margin: 0;
  color: #606266;
}

.generation-results {
  margin-bottom: 30px;
}

.result-actions {
  display: flex;
  gap: 10px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.image-item {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.image-item:hover {
  transform: translateY(-5px);
}

.image-wrapper {
  position: relative;
  aspect-ratio: 1;
}

.generated-image {
  width: 100%;
  height: 100%;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-wrapper:hover .image-overlay {
  opacity: 1;
}

.image-actions {
  display: flex;
  gap: 10px;
}

.image-info {
  padding: 15px;
  background: white;
}

.image-prompt {
  font-weight: 500;
  color: #303133;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.image-meta {
  font-size: 12px;
  color: #909399;
  margin: 0;
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #c0c4cc;
}

.history-section {
  margin-bottom: 30px;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
}

.history-item {
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.history-item:hover {
  transform: scale(1.05);
}

.history-image {
  width: 100%;
  aspect-ratio: 1;
}

.history-info {
  padding: 10px;
  background: white;
}

.history-prompt {
  font-size: 12px;
  color: #303133;
  margin: 0 0 5px 0;
  line-height: 1.3;
}

.history-time {
  font-size: 11px;
  color: #909399;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .ai-image-container {
    padding: 10px;
  }
  
  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
  }
  
  .history-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 10px;
  }
  
  .advanced-options {
    flex-direction: column;
    gap: 10px;
  }
}
</style>