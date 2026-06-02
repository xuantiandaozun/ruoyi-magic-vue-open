<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="auto">
      <el-form-item label="用户ID" prop="miniUserId">
        <el-input v-model="queryParams.miniUserId" placeholder="请输入用户ID" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="解析状态" prop="parseStatus">
        <el-select v-model="queryParams.parseStatus" placeholder="请选择" clearable>
          <el-option label="待解析" value="pending" />
          <el-option label="解析中" value="parsing" />
          <el-option label="已解析" value="parsed" />
          <el-option label="解析失败" value="failed" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
          <el-option label="正常" value="0" />
          <el-option label="已删除" value="1" />
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
      <el-table-column label="ID" align="center" prop="id" width="80" />
      <el-table-column label="用户ID" align="center" prop="miniUserId" width="90" />
      <el-table-column label="原始文件名" align="center" prop="originalName" show-overflow-tooltip min-width="160" />
      <el-table-column label="文件类型" align="center" prop="fileExt" width="90" />
      <el-table-column label="文件大小" align="center" prop="fileSize" width="100">
        <template #default="scope">
          {{ scope.row.fileSize ? (scope.row.fileSize / 1024).toFixed(1) + ' KB' : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="来源类型" align="center" prop="sourceType" width="100" />
      <el-table-column label="解析状态" align="center" prop="parseStatus" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.parseStatus === 'pending'" type="info">待解析</el-tag>
          <el-tag v-else-if="scope.row.parseStatus === 'parsing'" type="primary">解析中</el-tag>
          <el-tag v-else-if="scope.row.parseStatus === 'parsed'" type="success">已解析</el-tag>
          <el-tag v-else-if="scope.row.parseStatus === 'failed'" type="danger">解析失败</el-tag>
          <span v-else>{{ scope.row.parseStatus }}</span>
        </template>
      </el-table-column>
      <el-table-column label="上传时间" align="center" prop="createTime" width="160" />
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup name="TranslateDocument">
import { listTranslateDocument } from '@/api/miniapp/translateDocument'

const { proxy } = getCurrentInstance()
const dataList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)

const queryParams = ref({ pageNum: 1, pageSize: 10, miniUserId: null, parseStatus: null, status: null })

function getList() {
  loading.value = true
  listTranslateDocument(queryParams.value).then(res => {
    dataList.value = res.rows
    total.value = res.total
    loading.value = false
  })
}

function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }

onMounted(() => { getList() })
</script>
