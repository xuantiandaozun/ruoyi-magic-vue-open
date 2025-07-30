<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="60%"
    :before-close="handleClose"
    :z-index="3000"
    append-to-body
    destroy-on-close
  >
    <div class="directory-selector">
      <!-- 常用路径 -->
      <div class="common-paths">
        <h4>常用路径</h4>
        <el-row :gutter="10">
          <el-col :span="8" v-for="path in commonPaths" :key="path.path">
            <el-button 
              type="text" 
              @click="navigateToPath(path.path)"
              class="common-path-btn"
            >
              <div>
                <div class="path-name">{{ path.name }}</div>
                <div class="path-desc">{{ path.description }}</div>
              </div>
            </el-button>
          </el-col>
        </el-row>
      </div>

      <!-- 当前路径 -->
      <div class="current-path">
        <el-input
          v-model="currentPath"
          placeholder="输入路径或点击下方目录浏览"
          @keyup.enter="navigateToPath(currentPath)"
        >
          <template #prepend>当前路径</template>
          <template #append>
            <el-button @click="navigateToPath(currentPath)" icon="el-icon-search">浏览</el-button>
          </template>
        </el-input>
      </div>

      <!-- 目录列表 -->
      <div class="directory-list" v-loading="loading">
        <el-table
          :data="directories"
          @row-click="handleRowClick"
          height="300"
          style="width: 100%"
        >
          <el-table-column prop="name" label="名称" min-width="200">
            <template #default="{ row }">
              <el-icon v-if="row.type === 'parent'"><ArrowUp /></el-icon>
              <el-icon v-else-if="row.isDirectory"><Folder /></el-icon>
              <el-icon v-else><Document /></el-icon>
              <span style="margin-left: 8px">{{ row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.type === 'parent'" type="info">上级</el-tag>
              <el-tag v-else-if="row.isDirectory" type="success">文件夹</el-tag>
              <el-tag v-else type="warning">文件</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="path" label="路径" show-overflow-tooltip />
        </el-table>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :disabled="!selectedPath">
          确定选择
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { getDirectories, getCommonPaths, validatePath } from '@/api/tool/gen'
import { ElMessage } from 'element-plus'
import { ArrowUp, Folder, Document } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '选择目录'
  }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const currentPath = ref('')
const selectedPath = ref('')
const commonPaths = ref([])
const directories = ref([])

// 获取常用路径
const loadCommonPaths = async () => {
  try {
    const response = await getCommonPaths()
    commonPaths.value = response || []
  } catch (error) {
    console.error('获取常用路径失败:', error)
  }
}

// 浏览目录
const navigateToPath = async (path) => {
  if (!path) path = ''
  
  loading.value = true
  try {
    const response = await getDirectories(path)
    currentPath.value = response.currentPath
    directories.value = response.directories || []
    selectedPath.value = response.currentPath
  } catch (error) {
    ElMessage.error('获取目录失败')
    console.error('获取目录失败:', error)
  } finally {
    loading.value = false
  }
}

// 处理行点击
const handleRowClick = (row) => {
  if (row.isDirectory) {
    navigateToPath(row.path)
  }
}

// 确认选择
const handleConfirm = async () => {
  if (!selectedPath.value) {
    ElMessage.warning('请选择一个目录')
    return
  }

  try {
    const response = await validatePath(selectedPath.value)
    if (response.valid) {
      emit('confirm', response.absolutePath)
      handleClose()
    } else {
      ElMessage.error('路径无效')
    }
  } catch (error) {
    ElMessage.error('路径验证失败')
    console.error('路径验证失败:', error)
  }
}

// 关闭对话框
const handleClose = () => {
  visible.value = false
}

// 监听对话框打开
watch(visible, (newVal) => {
  if (newVal) {
    loadCommonPaths()
    // 默认加载当前工作目录
    navigateToPath('')
  }
})
</script>

<style scoped>
.directory-selector {
  padding: 10px 0;
}

.common-paths {
  margin-bottom: 20px;
}

.common-paths h4 {
  margin: 0 0 10px 0;
  color: #606266;
}

.common-path-btn {
  width: 100%;
  height: auto;
  padding: 10px;
  text-align: left;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  margin-bottom: 10px;
}

.common-path-btn:hover {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.path-name {
  font-weight: bold;
  color: #303133;
}

.path-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.current-path {
  margin-bottom: 20px;
}

.directory-list {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

:deep(.el-table__row) {
  cursor: pointer;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}
</style>