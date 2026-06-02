<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="auto">
      <el-form-item label="用户ID" prop="miniUserId">
        <el-input v-model="queryParams.miniUserId" placeholder="请输入用户ID" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="源语言" prop="sourceLanguage">
        <el-input v-model="queryParams.sourceLanguage" placeholder="如 zh" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="目标语言" prop="targetLanguage">
        <el-input v-model="queryParams.targetLanguage" placeholder="如 en" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
          <el-option label="待处理" value="pending" />
          <el-option label="解析中" value="parsing" />
          <el-option label="翻译中" value="translating" />
          <el-option label="重建中" value="rebuilding" />
          <el-option label="校验中" value="verifying" />
          <el-option label="成功" value="success" />
          <el-option label="失败" value="failed" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="dataList">
      <el-table-column label="任务ID" align="center" prop="id" width="80" />
      <el-table-column label="用户ID" align="center" prop="miniUserId" width="90" />
      <el-table-column label="文件名" align="center" prop="documentName" show-overflow-tooltip min-width="160" />
      <el-table-column label="源语言" align="center" prop="sourceLanguage" width="90" />
      <el-table-column label="目标语言" align="center" prop="targetLanguage" width="90" />
      <el-table-column label="输出格式" align="center" prop="outputFormat" width="100" />
      <el-table-column label="进度" align="center" prop="progress" width="120">
        <template #default="scope">
          <el-progress :percentage="scope.row.progress || 0" :status="scope.row.status === 'success' ? 'success' : (scope.row.status === 'failed' ? 'exception' : '')" />
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 'pending'" type="info">待处理</el-tag>
          <el-tag v-else-if="scope.row.status === 'parsing'" type="primary">解析中</el-tag>
          <el-tag v-else-if="scope.row.status === 'translating'" type="primary">翻译中</el-tag>
          <el-tag v-else-if="scope.row.status === 'rebuilding'" type="primary">重建中</el-tag>
          <el-tag v-else-if="scope.row.status === 'verifying'" type="warning">校验中</el-tag>
          <el-tag v-else-if="scope.row.status === 'success'" type="success">成功</el-tag>
          <el-tag v-else-if="scope.row.status === 'failed'" type="danger">失败</el-tag>
          <el-tag v-else type="info">{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="模型" align="center" prop="modelName" width="120" show-overflow-tooltip />
      <el-table-column label="重试次数" align="center" prop="retryCount" width="90" />
      <el-table-column label="创建时间" align="center" prop="createTime" width="160" />
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup name="TranslateTask">
import { listTranslateTask } from '@/api/miniapp/translateTask'

const { proxy } = getCurrentInstance()
const dataList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)

const queryParams = ref({ pageNum: 1, pageSize: 10, miniUserId: null, sourceLanguage: null, targetLanguage: null, status: null })

function getList() {
  loading.value = true
  listTranslateTask(queryParams.value).then(res => {
    dataList.value = res.rows
    total.value = res.total
    loading.value = false
  })
}

function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }

onMounted(() => { getList() })
</script>
