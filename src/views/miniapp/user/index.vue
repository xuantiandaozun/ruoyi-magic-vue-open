<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="auto">
      <el-form-item label="昵称" prop="nickname">
        <el-input v-model="queryParams.nickname" placeholder="请输入昵称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="手机号" prop="mobile">
        <el-input v-model="queryParams.mobile" placeholder="请输入手机号" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="来源AppCode" prop="sourceAppCode">
        <el-input v-model="queryParams.sourceAppCode" placeholder="请输入AppCode" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
          <el-option label="正常" value="0" />
          <el-option label="停用" value="1" />
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
      <el-table-column label="头像" align="center" width="70">
        <template #default="scope">
          <el-avatar :src="scope.row.avatar" :size="36" v-if="scope.row.avatar" />
          <el-avatar :size="36" v-else>{{ scope.row.nickname ? scope.row.nickname[0] : '?' }}</el-avatar>
        </template>
      </el-table-column>
      <el-table-column label="昵称" align="center" prop="nickname" />
      <el-table-column label="手机号" align="center" prop="mobile" />
      <el-table-column label="邮箱" align="center" prop="email" show-overflow-tooltip />
      <el-table-column label="来源应用" align="center" prop="sourceAppCode">
        <template #default="scope">
          <el-tag type="info">{{ scope.row.sourceAppCode }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="最后登录" align="center" prop="lastLoginTime" width="160" />
      <el-table-column label="状态" align="center" prop="status" width="80">
        <template #default="scope">
          <el-tag v-if="scope.row.status === '0'" type="success">正常</el-tag>
          <el-tag v-else type="danger">停用</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="注册时间" align="center" prop="createTime" width="160" />
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup name="MiniUser">
import { listMiniUser } from '@/api/miniapp/user'

const { proxy } = getCurrentInstance()
const dataList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)

const queryParams = ref({ pageNum: 1, pageSize: 10, nickname: null, mobile: null, sourceAppCode: null, status: null })

function getList() {
  loading.value = true
  listMiniUser(queryParams.value).then(res => {
    dataList.value = res.rows
    total.value = res.total
    loading.value = false
  })
}

function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }

onMounted(() => { getList() })
</script>
