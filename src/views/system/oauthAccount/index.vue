<template>
  <div class="app-container">
    <el-form ref="queryRef" :model="queryParams" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="用户ID" prop="userId"><el-input v-model="queryParams.userId" clearable @keyup.enter="handleQuery" /></el-form-item>
      <el-form-item label="平台" prop="provider"><el-input v-model="queryParams.provider" clearable @keyup.enter="handleQuery" /></el-form-item>
      <el-form-item label="OpenID" prop="openId"><el-input v-model="queryParams.openId" clearable @keyup.enter="handleQuery" /></el-form-item>
      <el-form-item label="状态" prop="status"><el-select v-model="queryParams.status" clearable style="width:120px"><el-option label="正常" value="0" /><el-option label="停用" value="1" /></el-select></el-form-item>
      <el-form-item><el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button><el-button icon="Refresh" @click="resetQuery">重置</el-button></el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['system:oauthAccount:add']">新增</el-button></el-col>
      <el-col :span="1.5"><el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate" v-hasPermi="['system:oauthAccount:edit']">修改</el-button></el-col>
      <el-col :span="1.5"><el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['system:oauthAccount:remove']">删除</el-button></el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" />
      <el-table-column label="ID" prop="id" width="80" />
      <el-table-column label="用户ID" prop="userId" width="100" />
      <el-table-column label="平台" prop="provider" width="110" />
      <el-table-column label="OpenID" prop="openId" min-width="160" show-overflow-tooltip />
      <el-table-column label="邮箱" prop="email" min-width="150" show-overflow-tooltip />
      <el-table-column label="昵称" prop="nickname" min-width="120" show-overflow-tooltip />
      <el-table-column label="绑定时间" prop="bindTime" width="170" />
      <el-table-column label="最近登录" prop="lastLoginTime" width="170" />
      <el-table-column label="状态" prop="status" width="90"><template #default="scope"><el-tag :type="scope.row.status === '0' ? 'success' : 'info'">{{ scope.row.status === '0' ? '正常' : '停用' }}</el-tag></template></el-table-column>
      <el-table-column label="操作" width="150" fixed="right"><template #default="scope"><el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['system:oauthAccount:edit']">修改</el-button><el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['system:oauthAccount:remove']">删除</el-button></template></el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="820px" append-to-body>
      <el-form ref="formRef" :model="form" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="系统用户ID"><el-input-number v-model="form.userId" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="第三方平台"><el-input v-model="form.provider" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="OpenID"><el-input v-model="form.openId" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="UnionID"><el-input v-model="form.unionId" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="邮箱"><el-input v-model="form.email" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="昵称"><el-input v-model="form.nickname" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="头像"><el-input v-model="form.avatar" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="令牌过期"><el-date-picker v-model="form.tokenExpireTime" value-format="YYYY-MM-DD HH:mm:ss" type="datetime" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="状态"><el-radio-group v-model="form.status"><el-radio label="0">正常</el-radio><el-radio label="1">停用</el-radio></el-radio-group></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="AccessToken"><el-input v-model="form.accessToken" type="textarea" :rows="2" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="RefreshToken"><el-input v-model="form.refreshToken" type="textarea" :rows="2" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="原始JSON"><el-input v-model="form.rawJson" type="textarea" :rows="3" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="备注"><el-input v-model="form.remark" type="textarea" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer><el-button type="primary" @click="submitForm">确定</el-button><el-button @click="cancel">取消</el-button></template>
    </el-dialog>
  </div>
</template>
<script setup name="SysOauthAccount">
import { listOauthAccount, getOauthAccount, addOauthAccount, updateOauthAccount, delOauthAccount } from '@/api/system/oauthAccount'
const { proxy } = getCurrentInstance()
const list = ref([]), loading = ref(true), showSearch = ref(true), open = ref(false), total = ref(0), title = ref('')
const ids = ref([]), single = ref(true), multiple = ref(true)
const data = reactive({ form: {}, queryParams: { pageNum: 1, pageSize: 10, userId: null, provider: null, openId: null, status: null } })
const { queryParams, form } = toRefs(data)
function getList() { loading.value = true; listOauthAccount(queryParams.value).then(res => { list.value = res.rows; total.value = res.total; loading.value = false }) }
function reset() { form.value = { id: null, userId: null, provider: null, openId: null, unionId: null, email: null, nickname: null, avatar: null, accessToken: null, refreshToken: null, tokenExpireTime: null, rawJson: null, status: '0', remark: null }; proxy.resetForm('formRef') }
function cancel() { open.value = false; reset() }
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }
function handleSelectionChange(selection) { ids.value = selection.map(item => item.id); single.value = selection.length !== 1; multiple.value = !selection.length }
function handleAdd() { reset(); open.value = true; title.value = '新增第三方账号绑定' }
function handleUpdate(row) { reset(); getOauthAccount(row.id || ids.value[0]).then(res => { form.value = res; open.value = true; title.value = '修改第三方账号绑定' }) }
function submitForm() { const action = form.value.id ? updateOauthAccount : addOauthAccount; action(form.value).then(() => { proxy.$modal.msgSuccess('保存成功'); open.value = false; getList() }) }
function handleDelete(row) { const deleteIds = row.id || ids.value; proxy.$modal.confirm(`确认删除编号为 "${deleteIds}" 的数据项？`).then(() => delOauthAccount(deleteIds)).then(() => { getList(); proxy.$modal.msgSuccess('删除成功') }).catch(() => {}) }
getList()
</script>
