<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="auto">
      <el-form-item label="来源应用" prop="appCode">
        <el-input v-model="queryParams.appCode" placeholder="请输入AppCode" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="反馈类型" prop="feedbackType">
        <el-select v-model="queryParams.feedbackType" placeholder="请选择类型" clearable>
          <el-option label="建议" value="suggestion" />
          <el-option label="Bug" value="bug" />
          <el-option label="其他" value="other" />
        </el-select>
      </el-form-item>
      <el-form-item label="处理状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
          <el-option label="待处理" value="pending" />
          <el-option label="已回复" value="2" />
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
      <el-table-column label="来源应用" align="center" prop="appCode" width="120">
        <template #default="scope">
          <el-tag type="info">{{ scope.row.appCode }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="反馈类型" align="center" prop="feedbackType" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.feedbackType === 'suggestion'" type="primary">建议</el-tag>
          <el-tag v-else-if="scope.row.feedbackType === 'bug'" type="danger">Bug</el-tag>
          <el-tag v-else type="info">{{ scope.row.feedbackType }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="反馈内容" align="center" prop="content" show-overflow-tooltip min-width="200" />
      <el-table-column label="联系方式" align="center" prop="contact" width="130" />
      <el-table-column label="状态" align="center" prop="status" width="90">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 'pending'" type="warning">待处理</el-tag>
          <el-tag v-else-if="scope.row.status === '2'" type="success">已回复</el-tag>
          <el-tag v-else type="info">{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="提交时间" align="center" prop="createTime" width="160" />
      <el-table-column label="操作" align="center" width="160">
        <template #default="scope">
          <el-button link type="primary" icon="ChatDotRound" @click="handleReply(scope.row)" v-hasPermi="['manage:minifeedback:edit']">回复</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['manage:minifeedback:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 回复对话框 -->
    <el-dialog title="回复反馈" v-model="replyOpen" width="600px" append-to-body>
      <div class="feedback-content" v-if="currentFeedback">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="来源应用">{{ currentFeedback.appCode }}</el-descriptions-item>
          <el-descriptions-item label="反馈类型">{{ currentFeedback.feedbackType }}</el-descriptions-item>
          <el-descriptions-item label="联系方式">{{ currentFeedback.contact || '-' }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ currentFeedback.createTime }}</el-descriptions-item>
          <el-descriptions-item label="反馈内容" :span="2">{{ currentFeedback.content }}</el-descriptions-item>
        </el-descriptions>
        <div class="reply-form" style="margin-top: 16px;">
          <el-form ref="replyRef" :model="replyForm" :rules="replyRules" label-width="80px">
            <el-form-item label="回复内容" prop="replyContent">
              <el-input v-model="replyForm.replyContent" type="textarea" :rows="4" placeholder="请输入回复内容" />
            </el-form-item>
          </el-form>
        </div>
        <div v-if="currentFeedback.replyContent" style="margin-top:8px; color: #67c23a;">
          <strong>历史回复：</strong>{{ currentFeedback.replyContent }}（{{ currentFeedback.replyTime }}）
        </div>
      </div>
      <template #footer>
        <el-button @click="replyOpen = false">取 消</el-button>
        <el-button type="primary" @click="submitReply">确认回复</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="MiniFeedback">
import { delFeedback, getFeedback, listFeedback, replyFeedback } from '@/api/miniapp/feedback'

const { proxy } = getCurrentInstance()
const dataList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const replyOpen = ref(false)
const currentFeedback = ref(null)
const replyForm = ref({ id: null, replyContent: '' })
const replyRules = { replyContent: [{ required: true, message: '回复内容不能为空', trigger: 'blur' }] }

const queryParams = ref({ pageNum: 1, pageSize: 10, appCode: null, feedbackType: null, status: null })

function getList() {
  loading.value = true
  listFeedback(queryParams.value).then(res => {
    dataList.value = res.rows
    total.value = res.total
    loading.value = false
  })
}

function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }

function handleReply(row) {
  getFeedback(row.id).then(response => {
    currentFeedback.value = response
    replyForm.value = { id: row.id, replyContent: response.replyContent || '' }
    replyOpen.value = true
  })
}

function submitReply() {
  proxy.$refs['replyRef'].validate(valid => {
    if (valid) {
      replyFeedback(replyForm.value).then(() => {
        proxy.$modal.msgSuccess('回复成功')
        replyOpen.value = false
        getList()
      })
    }
  })
}

function handleDelete(row) {
  proxy.$modal.confirm(`是否确认删除该反馈？`).then(() => delFeedback(row.id)).then(() => { getList(); proxy.$modal.msgSuccess('删除成功') }).catch(() => {})
}

onMounted(() => { getList() })
</script>
