<template>
  <div class="app-container">
    <el-form ref="queryRef" :model="queryParams" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="日期" prop="summaryDate"><el-date-picker v-model="queryParams.summaryDate" value-format="YYYY-MM-DD" type="date" clearable /></el-form-item>
      <el-form-item label="用户ID" prop="userId"><el-input v-model="queryParams.userId" clearable @keyup.enter="handleQuery" /></el-form-item>
      <el-form-item label="产品类型" prop="productType"><el-input v-model="queryParams.productType" clearable @keyup.enter="handleQuery" /></el-form-item>
      <el-form-item label="模型厂商" prop="provider"><el-input v-model="queryParams.provider" clearable @keyup.enter="handleQuery" /></el-form-item>
      <el-form-item><el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button><el-button icon="Refresh" @click="resetQuery">重置</el-button></el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['ai:usageSummaryDaily:add']">新增</el-button></el-col>
      <el-col :span="1.5"><el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate" v-hasPermi="['ai:usageSummaryDaily:edit']">修改</el-button></el-col>
      <el-col :span="1.5"><el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['ai:usageSummaryDaily:remove']">删除</el-button></el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" />
      <el-table-column label="ID" prop="id" width="80" />
      <el-table-column label="日期" prop="summaryDate" width="120" />
      <el-table-column label="用户ID" prop="userId" width="100" />
      <el-table-column label="产品" prop="productType" width="100" />
      <el-table-column label="厂商" prop="provider" width="110" />
      <el-table-column label="模型" prop="modelName" min-width="140" show-overflow-tooltip />
      <el-table-column label="请求" prop="requestCount" width="90" />
      <el-table-column label="成功" prop="successCount" width="90" />
      <el-table-column label="失败" prop="failedCount" width="90" />
      <el-table-column label="总Token" prop="totalTokens" width="110" />
      <el-table-column label="图片" prop="imageCount" width="80" />
      <el-table-column label="成本" prop="estimatedCost" width="100" />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="scope"><el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['ai:usageSummaryDaily:edit']">修改</el-button><el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['ai:usageSummaryDaily:remove']">删除</el-button></template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="760px" append-to-body>
      <el-form ref="formRef" :model="form" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="汇总日期"><el-date-picker v-model="form.summaryDate" value-format="YYYY-MM-DD" type="date" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="用户ID"><el-input-number v-model="form.userId" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="产品类型"><el-input v-model="form.productType" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="模型厂商"><el-input v-model="form.provider" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="模型名称"><el-input v-model="form.modelName" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="币种"><el-input v-model="form.currency" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="请求次数"><el-input-number v-model="form.requestCount" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="成功次数"><el-input-number v-model="form.successCount" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="失败次数"><el-input-number v-model="form.failedCount" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="输入Token"><el-input-number v-model="form.inputTokens" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="输出Token"><el-input-number v-model="form.outputTokens" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="缓存Token"><el-input-number v-model="form.cachedInputTokens" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="总Token"><el-input-number v-model="form.totalTokens" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="图片数量"><el-input-number v-model="form.imageCount" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="预估成本"><el-input-number v-model="form.estimatedCost" :min="0" :precision="8" style="width:100%" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer><el-button type="primary" @click="submitForm">确定</el-button><el-button @click="cancel">取消</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup name="AiUsageSummaryDaily">
import { listUsageSummaryDaily, getUsageSummaryDaily, addUsageSummaryDaily, updateUsageSummaryDaily, delUsageSummaryDaily } from '@/api/ai/usageSummaryDaily'

const { proxy } = getCurrentInstance()
const list = ref([]), loading = ref(true), showSearch = ref(true), open = ref(false), total = ref(0), title = ref('')
const ids = ref([]), single = ref(true), multiple = ref(true)
const data = reactive({ form: {}, queryParams: { pageNum: 1, pageSize: 10, summaryDate: null, userId: null, productType: null, provider: null } })
const { queryParams, form } = toRefs(data)
function getList() { loading.value = true; listUsageSummaryDaily(queryParams.value).then(res => { list.value = res.rows; total.value = res.total; loading.value = false }) }
function reset() { form.value = { id: null, summaryDate: null, userId: null, productType: 'chat', provider: null, modelName: null, requestCount: 0, successCount: 0, failedCount: 0, inputTokens: 0, outputTokens: 0, cachedInputTokens: 0, totalTokens: 0, imageCount: 0, estimatedCost: 0, currency: 'USD' }; proxy.resetForm('formRef') }
function cancel() { open.value = false; reset() }
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }
function handleSelectionChange(selection) { ids.value = selection.map(item => item.id); single.value = selection.length !== 1; multiple.value = !selection.length }
function handleAdd() { reset(); open.value = true; title.value = '新增每日用量汇总' }
function handleUpdate(row) { reset(); getUsageSummaryDaily(row.id || ids.value[0]).then(res => { form.value = res; open.value = true; title.value = '修改每日用量汇总' }) }
function submitForm() { const action = form.value.id ? updateUsageSummaryDaily : addUsageSummaryDaily; action(form.value).then(() => { proxy.$modal.msgSuccess('保存成功'); open.value = false; getList() }) }
function handleDelete(row) { const deleteIds = row.id || ids.value; proxy.$modal.confirm(`确认删除编号为 "${deleteIds}" 的数据项？`).then(() => delUsageSummaryDaily(deleteIds)).then(() => { getList(); proxy.$modal.msgSuccess('删除成功') }).catch(() => {}) }
getList()
</script>
