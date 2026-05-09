<template>
  <div class="app-container">
    <el-form ref="queryRef" :model="queryParams" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="昵称" prop="nickname">
        <el-input v-model="queryParams.nickname" placeholder="请输入昵称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="queryParams.email" placeholder="请输入邮箱" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="账号状态" clearable style="width: 120px">
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
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleBatchRemoveQuota" v-hasPermi="['ai:pluginUser:removeQuota']">批量清除额度</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="用户ID" prop="userId" width="80" />
      <el-table-column label="头像" width="70">
        <template #default="scope">
          <el-avatar v-if="scope.row.avatar" :size="40" :src="scope.row.avatar" />
          <el-avatar v-else :size="40" icon="UserFilled" />
        </template>
      </el-table-column>
      <el-table-column label="昵称" prop="nickname" min-width="120" show-overflow-tooltip />
      <el-table-column label="邮箱" prop="email" min-width="180" show-overflow-tooltip />
      <el-table-column label="专属额度" width="100" align="center">
        <template #default="scope">
          <el-tag v-if="scope.row.hasPersonalQuota" type="success">已配置</el-tag>
          <el-tag v-else type="info">默认</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="今日请求" width="140">
        <template #default="scope">
          <div style="display: flex; align-items: center; gap: 8px;">
            <el-progress
              :percentage="calcPercentage(scope.row.todayUsedRequests, scope.row.requestLimit)"
              :color="getProgressColor(scope.row.todayUsedRequests, scope.row.requestLimit)"
              :stroke-width="16"
              style="flex: 1; min-width: 60px;"
            />
            <span style="white-space: nowrap; font-size: 12px;">
              {{ scope.row.todayUsedRequests }}/{{ scope.row.requestLimit === -1 ? '∞' : scope.row.requestLimit }}
            </span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="今日Token" width="140">
        <template #default="scope">
          <div style="display: flex; align-items: center; gap: 8px;">
            <el-progress
              :percentage="calcPercentage(scope.row.todayUsedTokens, scope.row.tokenLimit)"
              :color="getProgressColor(scope.row.todayUsedTokens, scope.row.tokenLimit)"
              :stroke-width="16"
              style="flex: 1; min-width: 60px;"
            />
            <span style="white-space: nowrap; font-size: 12px;">
              {{ formatNumber(scope.row.todayUsedTokens) }}/{{ scope.row.tokenLimit === -1 ? '∞' : formatNumber(scope.row.tokenLimit) }}
            </span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="绑定时间" prop="bindTime" width="160" />
      <el-table-column label="最近登录" prop="lastLoginTime" width="160" />
      <el-table-column label="状态" prop="status" width="80">
        <template #default="scope">
          <el-tag :type="scope.row.status === '0' ? 'success' : 'danger'">
            {{ scope.row.status === '0' ? '正常' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="200" fixed="right">
        <template #default="scope">
          <el-tooltip content="设置专属额度" placement="top">
            <el-button link type="primary" icon="Coin" @click="handleSetQuota(scope.row)" v-hasPermi="['ai:pluginUser:setQuota']">额度</el-button>
          </el-tooltip>
          <el-tooltip v-if="scope.row.hasPersonalQuota" content="清除专属额度" placement="top">
            <el-button link type="danger" icon="Delete" @click="handleRemoveQuota(scope.row)" v-hasPermi="['ai:pluginUser:removeQuota']">清除</el-button>
          </el-tooltip>
          <el-tooltip content="查看详情" placement="top">
            <el-button link type="info" icon="View" @click="handleView(scope.row)">详情</el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 设置专属额度对话框 -->
    <el-dialog :title="'设置用户专属额度 - ' + currentUser.nickname" v-model="quotaDialogOpen" width="600px" append-to-body>
      <el-form ref="quotaFormRef" :model="quotaForm" :rules="quotaRules" label-width="120px">
        <el-form-item label="用户ID">
          <el-input v-model="quotaForm.userId" disabled />
        </el-form-item>
        <el-form-item label="昵称 / 邮箱">
          <el-input :value="currentUser.nickname + ' (' + currentUser.email + ')'" disabled />
        </el-form-item>
        <el-divider content-position="left">额度配置</el-divider>
        <el-form-item label="每日请求上限" prop="requestLimit">
          <el-input-number v-model="quotaForm.requestLimit" :min="0" :max="10000" style="width: 100%" />
          <span style="color: #999; font-size: 12px; margin-left: 10px;">0表示不限制</span>
        </el-form-item>
        <el-form-item label="每日Token上限" prop="tokenLimit">
          <el-input-number v-model="quotaForm.tokenLimit" :min="0" :max="10000000" style="width: 100%" />
          <span style="color: #999; font-size: 12px; margin-left: 10px;">0表示不限制</span>
        </el-form-item>
        <el-form-item label="并发任务上限">
          <el-input-number v-model="quotaForm.concurrentLimit" :min="0" :max="100" style="width: 100%" />
        </el-form-item>
        <el-form-item label="启用">
          <el-radio-group v-model="quotaForm.enabled">
            <el-radio label="Y">是</el-radio>
            <el-radio label="N">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="quotaForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitQuota">确定</el-button>
        <el-button @click="quotaDialogOpen = false">取消</el-button>
      </template>
    </el-dialog>

    <!-- 用户详情对话框 -->
    <el-dialog title="用户详情" v-model="detailDialogOpen" width="800px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="用户ID">{{ userDetail.userId }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ userDetail.nickname }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ userDetail.email }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="userDetail.status === '0' ? 'success' : 'danger'">
            {{ userDetail.status === '0' ? '正常' : '停用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="绑定时间">{{ userDetail.bindTime }}</el-descriptions-item>
        <el-descriptions-item label="最近登录">{{ userDetail.lastLoginTime }}</el-descriptions-item>
      </el-descriptions>
      
      <el-divider content-position="left">额度信息</el-divider>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="专属额度">
          <el-tag v-if="userDetail.hasPersonalQuota" type="success">已配置</el-tag>
          <el-tag v-else type="info">使用默认等级额度</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="今日请求">
          {{ userDetail.todayUsedRequests }}/{{ userDetail.requestLimit === -1 ? '无限制' : userDetail.requestLimit }}
        </el-descriptions-item>
        <el-descriptions-item label="剩余请求">
          {{ userDetail.remainingRequests === -1 ? '无限制' : userDetail.remainingRequests }}
        </el-descriptions-item>
        <el-descriptions-item label="今日Token">
          {{ formatNumber(userDetail.todayUsedTokens) }}/{{ userDetail.tokenLimit === -1 ? '无限制' : formatNumber(userDetail.tokenLimit) }}
        </el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <el-button @click="detailDialogOpen = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="PluginUserManage">
import { listPluginUser, getPluginUser, setUserQuota, removeUserQuota, batchRemoveUserQuota } from '@/api/ai/pluginUser'

const { proxy } = getCurrentInstance()
const list = ref([])
const loading = ref(true)
const showSearch = ref(true)
const quotaDialogOpen = ref(false)
const detailDialogOpen = ref(false)
const total = ref(0)
const userIds = ref([])
const multiple = ref(true)
const currentUser = ref({})
const userDetail = ref({})

const data = reactive({
  queryParams: { 
    pageNum: 1, 
    pageSize: 10, 
    nickname: null, 
    email: null, 
    status: null 
  },
  quotaForm: {},
  quotaRules: {
    requestLimit: [{ required: true, message: '请求上限不能为空', trigger: 'blur' }],
    tokenLimit: [{ required: true, message: 'Token上限不能为空', trigger: 'blur' }]
  }
})
const { queryParams, quotaForm, quotaRules } = toRefs(data)

function getList() {
  loading.value = true
  listPluginUser(queryParams.value).then(res => {
    list.value = res.rows
    total.value = res.total
    loading.value = false
  })
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  proxy.resetForm('queryRef')
  handleQuery()
}

function handleSelectionChange(selection) {
  userIds.value = selection.map(item => item.userId)
  multiple.value = !selection.length
}

function handleSetQuota(row) {
  currentUser.value = row
  quotaForm.value = {
    userId: row.userId,
    quotaCode: row.personalQuotaCode || `plugin_user_${row.userId}`,
    requestLimit: row.hasPersonalQuota ? row.personalRequestLimit : (row.requestLimit === -1 ? 20 : row.requestLimit),
    tokenLimit: row.hasPersonalQuota ? row.personalTokenLimit : (row.tokenLimit === -1 ? 100000 : row.tokenLimit),
    concurrentLimit: row.hasPersonalQuota ? row.personalConcurrentLimit : 2,
    enabled: row.hasPersonalQuota ? row.personalEnabled : 'Y',
    remark: row.personalRemark || ''
  }
  quotaDialogOpen.value = true
}

function submitQuota() {
  proxy.$refs.quotaFormRef.validate(valid => {
    if (valid) {
      setUserQuota(quotaForm.value).then(() => {
        proxy.$modal.msgSuccess('设置成功')
        quotaDialogOpen.value = false
        getList()
      })
    }
  })
}

function handleRemoveQuota(row) {
  proxy.$modal.confirm('确认清除用户 "' + row.nickname + '" 的专属额度配置？清除后将恢复为默认等级额度。').then(() => {
    return removeUserQuota(row.userId)
  }).then(() => {
    proxy.$modal.msgSuccess('清除成功')
    getList()
  }).catch(() => {})
}

function handleBatchRemoveQuota() {
  if (userIds.value.length === 0) {
    proxy.$modal.msgWarning('请先选择用户')
    return
  }
  proxy.$modal.confirm('确认批量清除所选用户的专属额度配置？').then(() => {
    return batchRemoveUserQuota(userIds.value)
  }).then(() => {
    proxy.$modal.msgSuccess('批量清除成功')
    getList()
  }).catch(() => {})
}

function handleView(row) {
  getPluginUser(row.userId).then(res => {
    userDetail.value = {
      ...row,
      ...res.data
    }
    detailDialogOpen.value = true
  })
}

function calcPercentage(used, limit) {
  if (limit === -1 || limit === 0) return 0
  const percent = Math.round((used / limit) * 100)
  return Math.min(percent, 100)
}

function getProgressColor(used, limit) {
  if (limit === -1 || limit === 0) return '#67C23A'
  const percent = (used / limit) * 100
  if (percent >= 90) return '#F56C6C'
  if (percent >= 70) return '#E6A23C'
  return '#67C23A'
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num
}

getList()
</script>
