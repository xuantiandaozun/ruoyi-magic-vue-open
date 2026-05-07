<template>
  <div class="app-container">
    <el-form ref="queryRef" :model="queryParams" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="请求ID" prop="requestId"><el-input v-model="queryParams.requestId" clearable @keyup.enter="handleQuery" /></el-form-item>
      <el-form-item label="用户ID" prop="userId"><el-input v-model="queryParams.userId" clearable @keyup.enter="handleQuery" /></el-form-item>
      <el-form-item label="产品类型" prop="productType"><el-input v-model="queryParams.productType" clearable @keyup.enter="handleQuery" /></el-form-item>
      <el-form-item label="状态" prop="status"><el-input v-model="queryParams.status" clearable @keyup.enter="handleQuery" /></el-form-item>
      <el-form-item><el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button><el-button icon="Refresh" @click="resetQuery">重置</el-button></el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['ai:usageRecord:add']">新增</el-button></el-col>
      <el-col :span="1.5"><el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate" v-hasPermi="['ai:usageRecord:edit']">修改</el-button></el-col>
      <el-col :span="1.5"><el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['ai:usageRecord:remove']">删除</el-button></el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" />
      <el-table-column label="ID" prop="id" width="80" />
      <el-table-column label="请求ID" prop="requestId" min-width="160" show-overflow-tooltip />
      <el-table-column label="用户ID" prop="userId" width="100" />
      <el-table-column label="应用" prop="appCode" width="120" />
      <el-table-column label="产品" prop="productType" width="100" />
      <el-table-column label="厂商" prop="provider" width="110" />
      <el-table-column label="模型" prop="modelName" min-width="140" show-overflow-tooltip />
      <el-table-column label="输入Token" prop="inputTokens" width="110" />
      <el-table-column label="输出Token" prop="outputTokens" width="110" />
      <el-table-column label="总Token" prop="totalTokens" width="100" />
      <el-table-column label="成本" prop="estimatedCost" width="100" />
      <el-table-column label="状态" prop="status" width="100" />
      <el-table-column label="开始时间" prop="startTime" width="170" />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="scope"><el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['ai:usageRecord:edit']">修改</el-button><el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['ai:usageRecord:remove']">删除</el-button></template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="860px" append-to-body>
      <el-form ref="formRef" :model="form" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="请求ID"><el-input v-model="form.requestId" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="用户ID"><el-input-number v-model="form.userId" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="会话ID"><el-input-number v-model="form.sessionId" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="应用编码"><el-input v-model="form.appCode" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="产品类型"><el-input v-model="form.productType" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="模型配置ID"><el-input-number v-model="form.modelConfigId" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="模型厂商"><el-input v-model="form.provider" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="模型名称"><el-input v-model="form.modelName" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="输入Token"><el-input-number v-model="form.inputTokens" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="输出Token"><el-input-number v-model="form.outputTokens" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="缓存Token"><el-input-number v-model="form.cachedInputTokens" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="总Token"><el-input-number v-model="form.totalTokens" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="图片数量"><el-input-number v-model="form.imageCount" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="预估成本"><el-input-number v-model="form.estimatedCost" :min="0" :precision="8" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="币种"><el-input v-model="form.currency" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="状态"><el-input v-model="form.status" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="错误码"><el-input v-model="form.errorCode" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="耗时毫秒"><el-input-number v-model="form.durationMs" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="错误信息"><el-input v-model="form.errorMessage" type="textarea" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="请求元数据"><el-input v-model="form.requestMeta" type="textarea" :rows="3" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="响应元数据"><el-input v-model="form.responseMeta" type="textarea" :rows="3" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer><el-button type="primary" @click="submitForm">确定</el-button><el-button @click="cancel">取消</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup name="AiUsageRecord">
import { listUsageRecord, getUsageRecord, addUsageRecord, updateUsageRecord, delUsageRecord } from '@/api/ai/usageRecord'

const { proxy } = getCurrentInstance()
const list = ref([]), loading = ref(true), showSearch = ref(true), open = ref(false), total = ref(0), title = ref('')
const ids = ref([]), single = ref(true), multiple = ref(true)
const data = reactive({ form: {}, queryParams: { pageNum: 1, pageSize: 10, requestId: null, userId: null, productType: null, status: null } })
const { queryParams, form } = toRefs(data)
function getList() { loading.value = true; listUsageRecord(queryParams.value).then(res => { list.value = res.rows; total.value = res.total; loading.value = false }) }
function reset() { form.value = { id: null, requestId: null, userId: null, sessionId: null, appCode: null, productType: 'chat', modelConfigId: null, provider: null, modelName: null, inputTokens: 0, outputTokens: 0, cachedInputTokens: 0, totalTokens: 0, imageCount: 0, estimatedCost: 0, currency: 'USD', status: 'success', errorCode: null, errorMessage: null, durationMs: null, requestMeta: null, responseMeta: null }; proxy.resetForm('formRef') }
function cancel() { open.value = false; reset() }
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }
function handleSelectionChange(selection) { ids.value = selection.map(item => item.id); single.value = selection.length !== 1; multiple.value = !selection.length }
function handleAdd() { reset(); open.value = true; title.value = '新增AI使用记录' }
function handleUpdate(row) { reset(); getUsageRecord(row.id || ids.value[0]).then(res => { form.value = res; open.value = true; title.value = '修改AI使用记录' }) }
function submitForm() { const action = form.value.id ? updateUsageRecord : addUsageRecord; action(form.value).then(() => { proxy.$modal.msgSuccess('保存成功'); open.value = false; getList() }) }
function handleDelete(row) { const deleteIds = row.id || ids.value; proxy.$modal.confirm(`确认删除编号为 "${deleteIds}" 的数据项？`).then(() => delUsageRecord(deleteIds)).then(() => { getList(); proxy.$modal.msgSuccess('删除成功') }).catch(() => {}) }
getList()
</script>
