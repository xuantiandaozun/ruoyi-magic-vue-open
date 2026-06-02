<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="auto">
      <el-form-item label="昵称" prop="nickname">
        <el-input v-model="queryParams.nickname" placeholder="请输入评论者昵称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="评论内容" prop="content">
        <el-input v-model="queryParams.content" placeholder="请输入评论内容关键词" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="审核状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
          <el-option label="待审核" value="0" />
          <el-option label="已通过" value="1" />
          <el-option label="已拒绝" value="2" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="success" plain icon="Check" :disabled="ids.length === 0" @click="handleApprove" v-hasPermi="['article:comment:edit']">批量通过</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Close" :disabled="ids.length === 0" @click="handleReject" v-hasPermi="['article:comment:edit']">批量拒绝</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="ids.length === 0" @click="handleBatchDelete" v-hasPermi="['article:comment:remove']">批量删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="dataList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="ID" align="center" prop="id" width="80" />
      <el-table-column label="文章标题" align="center" prop="blogTitle" show-overflow-tooltip min-width="150" />
      <el-table-column label="昵称" align="center" prop="nickname" width="120" />
      <el-table-column label="IP地址" align="center" prop="userIp" width="130" />
      <el-table-column label="评论内容" align="center" prop="content" show-overflow-tooltip min-width="200" />
      <el-table-column label="点赞数" align="center" prop="likeCount" width="80" />
      <el-table-column label="回复数" align="center" prop="replyCount" width="80" />
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.status === '0'" type="warning">待审核</el-tag>
          <el-tag v-else-if="scope.row.status === '1'" type="success">已通过</el-tag>
          <el-tag v-else-if="scope.row.status === '2'" type="danger">已拒绝</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="评论时间" align="center" prop="createTime" width="160" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="200">
        <template #default="scope">
          <el-button v-if="scope.row.status === '0'" link type="success" icon="Check" @click="handleApproveOne(scope.row)" v-hasPermi="['article:comment:edit']">通过</el-button>
          <el-button v-if="scope.row.status === '0'" link type="warning" icon="Close" @click="handleRejectOne(scope.row)" v-hasPermi="['article:comment:edit']">拒绝</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['article:comment:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup name="ArticleComment">
import { approveComment, delComment, listComment, rejectComment } from '@/api/article/comment'

const { proxy } = getCurrentInstance()
const dataList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const ids = ref([])

const queryParams = ref({ pageNum: 1, pageSize: 10, nickname: null, content: null, status: null })

function getList() {
  loading.value = true
  listComment(queryParams.value).then(res => {
    dataList.value = res.rows
    total.value = res.total
    loading.value = false
  })
}

function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id)
}

function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }

function handleApproveOne(row) {
  approveComment(row.id).then(() => { proxy.$modal.msgSuccess('审核通过'); getList() })
}
function handleRejectOne(row) {
  rejectComment(row.id).then(() => { proxy.$modal.msgSuccess('已拒绝'); getList() })
}
function handleApprove() {
  approveComment(ids.value.join(',')).then(() => { proxy.$modal.msgSuccess('批量通过成功'); getList() })
}
function handleReject() {
  rejectComment(ids.value.join(',')).then(() => { proxy.$modal.msgSuccess('批量拒绝成功'); getList() })
}
function handleDelete(row) {
  proxy.$modal.confirm('是否确认删除该评论？').then(() => delComment(row.id)).then(() => { getList(); proxy.$modal.msgSuccess('删除成功') }).catch(() => {})
}
function handleBatchDelete() {
  proxy.$modal.confirm(`是否确认删除选中的 ${ids.value.length} 条评论？`).then(() => delComment(ids.value.join(','))).then(() => { getList(); proxy.$modal.msgSuccess('删除成功') }).catch(() => {})
}

onMounted(() => { getList() })
</script>
