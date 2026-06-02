<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="auto">
      <el-form-item label="文章ID" prop="blogId">
        <el-input v-model="queryParams.blogId" placeholder="请输入文章ID" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="用户IP" prop="userIp">
        <el-input v-model="queryParams.userIp" placeholder="请输入用户IP" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="点赞状态" prop="likeStatus">
        <el-select v-model="queryParams.likeStatus" placeholder="请选择" clearable>
          <el-option label="已点赞" value="1" />
          <el-option label="已取消" value="0" />
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
      <el-table-column label="文章标题" align="center" prop="blogTitle" show-overflow-tooltip min-width="180" />
      <el-table-column label="文章ID" align="center" prop="blogId" width="90" />
      <el-table-column label="用户ID" align="center" prop="userId" width="90" />
      <el-table-column label="用户IP" align="center" prop="userIp" width="130" />
      <el-table-column label="点赞状态" align="center" prop="likeStatus" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.likeStatus === '1'" type="success">已点赞</el-tag>
          <el-tag v-else type="info">已取消</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作时间" align="center" prop="createTime" width="160" />
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup name="ArticleLikeRecord">
import { listLikeRecord } from '@/api/article/likeRecord'

const { proxy } = getCurrentInstance()
const dataList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)

const queryParams = ref({ pageNum: 1, pageSize: 10, blogId: null, userIp: null, likeStatus: null })

function getList() {
  loading.value = true
  listLikeRecord(queryParams.value).then(res => {
    dataList.value = res.rows
    total.value = res.total
    loading.value = false
  })
}

function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }

onMounted(() => { getList() })
</script>
