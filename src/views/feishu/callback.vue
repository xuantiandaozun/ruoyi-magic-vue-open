<template>
  <div class="feishu-callback">
    <div class="callback-container">
      <div v-if="loading" class="loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <p>正在处理飞书授权...</p>
      </div>
      <div v-else-if="error" class="error">
        <el-icon><CircleClose /></el-icon>
        <p>授权失败：{{ error }}</p>
        <el-button @click="closeWindow">关闭窗口</el-button>
      </div>
      <div v-else class="success">
        <el-icon><CircleCheck /></el-icon>
        <p>授权成功！窗口将自动关闭...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElIcon, ElButton } from 'element-plus'
import { Loading, CircleClose, CircleCheck } from '@element-plus/icons-vue'

const loading = ref(true)
const error = ref('')

function getUrlParams() {
  const params = new URLSearchParams(window.location.search)
  return {
    code: params.get('code'),
    state: params.get('state'),
    error: params.get('error')
  }
}

function closeWindow() {
  if (window.opener) {
    window.close()
  } else {
    // 如果不是弹窗打开的，跳转到首页
    window.location.href = '/'
  }
}

function sendMessageToParent(data) {
  if (window.opener) {
    window.opener.postMessage(data, window.location.origin)
  }
}

onMounted(() => {
  const params = getUrlParams()
  
  setTimeout(() => {
    loading.value = false
    
    if (params.error) {
      error.value = params.error
      sendMessageToParent({
        type: 'FEISHU_AUTH_ERROR',
        error: params.error
      })
    } else if (params.code) {
      // 授权成功
      sendMessageToParent({
        type: 'FEISHU_AUTH_SUCCESS',
        code: params.code,
        state: params.state
      })
      
      // 2秒后关闭窗口
      setTimeout(() => {
        closeWindow()
      }, 2000)
    } else {
      error.value = '未获取到授权码'
      sendMessageToParent({
        type: 'FEISHU_AUTH_ERROR',
        error: '未获取到授权码'
      })
    }
  }, 1000)
})
</script>

<style scoped>
.feishu-callback {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f5f5f5;
}

.callback-container {
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
  min-width: 300px;
}

.loading, .error, .success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.loading .el-icon {
  font-size: 32px;
  color: #409eff;
}

.error .el-icon {
  font-size: 32px;
  color: #f56c6c;
}

.success .el-icon {
  font-size: 32px;
  color: #67c23a;
}

p {
  margin: 0;
  font-size: 16px;
  color: #606266;
}
</style>