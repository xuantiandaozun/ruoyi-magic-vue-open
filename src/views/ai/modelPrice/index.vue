<template>
  <div class="app-container">
    <el-form ref="queryRef" :model="queryParams" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="厂商" prop="provider"><el-input v-model="queryParams.provider" clearable @keyup.enter="handleQuery" /></el-form-item>
      <el-form-item label="模型" prop="modelName"><el-input v-model="queryParams.modelName" clearable @keyup.enter="handleQuery" /></el-form-item>
      <el-form-item label="币种" prop="currency"><el-input v-model="queryParams.currency" clearable @keyup.enter="handleQuery" /></el-form-item>
      <el-form-item label="启用" prop="enabled"><el-select v-model="queryParams.enabled" clearable style="width:120px"><el-option label="是" value="Y" /><el-option label="否" value="N" /></el-select></el-form-item>
      <el-form-item><el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button><el-button icon="Refresh" @click="resetQuery">重置</el-button></el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['ai:modelPrice:add']">新增</el-button></el-col>
      <el-col :span="1.5"><el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate" v-hasPermi="['ai:modelPrice:edit']">修改</el-button></el-col>
      <el-col :span="1.5"><el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['ai:modelPrice:remove']">删除</el-button></el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" />
      <el-table-column label="ID" prop="id" width="80" />
      <el-table-column label="模型配置ID" prop="modelConfigId" width="120" />
      <el-table-column label="厂商" prop="provider" width="110" />
      <el-table-column label="模型" prop="modelName" min-width="150" show-overflow-tooltip />
      <el-table-column label="币种" prop="currency" width="90" />
      <el-table-column label="输入/1M" prop="inputPricePer1mTokens" width="110" />
      <el-table-column label="输出/1M" prop="outputPricePer1mTokens" width="110" />
      <el-table-column label="缓存/1M" prop="cachedInputPricePer1mTokens" width="110" />
      <el-table-column label="图片单价" prop="imagePricePerUnit" width="110" />
      <el-table-column label="启用" prop="enabled" width="80"><template #default="scope"><el-tag :type="scope.row.enabled === 'Y' ? 'success' : 'info'">{{ scope.row.enabled === 'Y' ? '是' : '否' }}</el-tag></template></el-table-column>
      <el-table-column label="操作" width="150" fixed="right"><template #default="scope"><el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['ai:modelPrice:edit']">修改</el-button><el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['ai:modelPrice:remove']">删除</el-button></template></el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="760px" append-to-body>
      <el-form ref="formRef" :model="form" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="模型配置ID"><el-input-number v-model="form.modelConfigId" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="模型厂商"><el-input v-model="form.provider" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="模型名称"><el-input v-model="form.modelName" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="币种"><el-input v-model="form.currency" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="输入价格/1M"><el-input-number v-model="form.inputPricePer1mTokens" :min="0" :precision="8" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="输出价格/1M"><el-input-number v-model="form.outputPricePer1mTokens" :min="0" :precision="8" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="缓存价格/1M"><el-input-number v-model="form.cachedInputPricePer1mTokens" :min="0" :precision="8" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="图片单价"><el-input-number v-model="form.imagePricePerUnit" :min="0" :precision="8" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="生效时间"><el-date-picker v-model="form.effectiveTime" value-format="YYYY-MM-DD HH:mm:ss" type="datetime" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="失效时间"><el-date-picker v-model="form.expireTime" value-format="YYYY-MM-DD HH:mm:ss" type="datetime" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="启用"><el-radio-group v-model="form.enabled"><el-radio label="Y">是</el-radio><el-radio label="N">否</el-radio></el-radio-group></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="来源地址"><el-input v-model="form.sourceUrl" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="备注"><el-input v-model="form.remark" type="textarea" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer><el-button type="primary" @click="submitForm">确定</el-button><el-button @click="cancel">取消</el-button></template>
    </el-dialog>
  </div>
</template>
<script setup name="AiModelPrice">
import { listModelPrice, getModelPrice, addModelPrice, updateModelPrice, delModelPrice } from '@/api/ai/modelPrice'
const { proxy } = getCurrentInstance()
const list = ref([]), loading = ref(true), showSearch = ref(true), open = ref(false), total = ref(0), title = ref('')
const ids = ref([]), single = ref(true), multiple = ref(true)
const data = reactive({ form: {}, queryParams: { pageNum: 1, pageSize: 10, provider: null, modelName: null, currency: null, enabled: null } })
const { queryParams, form } = toRefs(data)
function getList() { loading.value = true; listModelPrice(queryParams.value).then(res => { list.value = res.rows; total.value = res.total; loading.value = false }) }
function reset() { form.value = { id: null, modelConfigId: null, provider: null, modelName: null, currency: 'USD', inputPricePer1mTokens: 0, outputPricePer1mTokens: 0, cachedInputPricePer1mTokens: 0, imagePricePerUnit: 0, effectiveTime: null, expireTime: null, enabled: 'Y', sourceUrl: null, remark: null }; proxy.resetForm('formRef') }
function cancel() { open.value = false; reset() }
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }
function handleSelectionChange(selection) { ids.value = selection.map(item => item.id); single.value = selection.length !== 1; multiple.value = !selection.length }
function handleAdd() { reset(); open.value = true; title.value = '新增模型价格' }
function handleUpdate(row) { reset(); getModelPrice(row.id || ids.value[0]).then(res => { form.value = res; open.value = true; title.value = '修改模型价格' }) }
function submitForm() { const action = form.value.id ? updateModelPrice : addModelPrice; action(form.value).then(() => { proxy.$modal.msgSuccess('保存成功'); open.value = false; getList() }) }
function handleDelete(row) { const deleteIds = row.id || ids.value; proxy.$modal.confirm(`确认删除编号为 "${deleteIds}" 的数据项？`).then(() => delModelPrice(deleteIds)).then(() => { getList(); proxy.$modal.msgSuccess('删除成功') }).catch(() => {}) }
getList()
</script>
