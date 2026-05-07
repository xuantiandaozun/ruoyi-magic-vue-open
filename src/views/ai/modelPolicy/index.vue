<template>
  <div class="app-container">
    <el-form ref="queryRef" :model="queryParams" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="模型ID" prop="modelConfigId"><el-input v-model="queryParams.modelConfigId" clearable @keyup.enter="handleQuery" /></el-form-item>
      <el-form-item label="产品类型" prop="productType"><el-input v-model="queryParams.productType" clearable @keyup.enter="handleQuery" /></el-form-item>
      <el-form-item label="用户等级" prop="userTier"><el-input v-model="queryParams.userTier" clearable @keyup.enter="handleQuery" /></el-form-item>
      <el-form-item label="启用" prop="enabled"><el-select v-model="queryParams.enabled" clearable style="width:120px"><el-option label="是" value="Y" /><el-option label="否" value="N" /></el-select></el-form-item>
      <el-form-item><el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button><el-button icon="Refresh" @click="resetQuery">重置</el-button></el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['ai:modelPolicy:add']">新增</el-button></el-col>
      <el-col :span="1.5"><el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate" v-hasPermi="['ai:modelPolicy:edit']">修改</el-button></el-col>
      <el-col :span="1.5"><el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['ai:modelPolicy:remove']">删除</el-button></el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" />
      <el-table-column label="ID" prop="id" width="80" />
      <el-table-column label="模型配置ID" prop="modelConfigId" width="120" />
      <el-table-column label="产品类型" prop="productType" width="110" />
      <el-table-column label="用户等级" prop="userTier" width="110" />
      <el-table-column label="优先级" prop="priority" width="90" />
      <el-table-column label="日请求" prop="dailyRequestLimit" width="100" />
      <el-table-column label="日Token" prop="dailyTokenLimit" width="110" />
      <el-table-column label="日图片" prop="dailyImageLimit" width="100" />
      <el-table-column label="最大上下文" prop="maxContextTokens" width="120" />
      <el-table-column label="最大输出" prop="maxOutputTokens" width="110" />
      <el-table-column label="启用" prop="enabled" width="80"><template #default="scope"><el-tag :type="scope.row.enabled === 'Y' ? 'success' : 'info'">{{ scope.row.enabled === 'Y' ? '是' : '否' }}</el-tag></template></el-table-column>
      <el-table-column label="操作" width="150" fixed="right"><template #default="scope"><el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['ai:modelPolicy:edit']">修改</el-button><el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['ai:modelPolicy:remove']">删除</el-button></template></el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="760px" append-to-body>
      <el-form ref="formRef" :model="form" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="模型配置ID"><el-input-number v-model="form.modelConfigId" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="产品类型"><el-input v-model="form.productType" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="用户等级"><el-input v-model="form.userTier" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="优先级"><el-input-number v-model="form.priority" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="日请求上限"><el-input-number v-model="form.dailyRequestLimit" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="日Token上限"><el-input-number v-model="form.dailyTokenLimit" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="日图片上限"><el-input-number v-model="form.dailyImageLimit" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="最大上下文"><el-input-number v-model="form.maxContextTokens" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="最大输出"><el-input-number v-model="form.maxOutputTokens" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="降级模型ID"><el-input-number v-model="form.fallbackModelConfigId" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="启用"><el-radio-group v-model="form.enabled"><el-radio label="Y">是</el-radio><el-radio label="N">否</el-radio></el-radio-group></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="配置JSON"><el-input v-model="form.configJson" type="textarea" :rows="3" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="备注"><el-input v-model="form.remark" type="textarea" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer><el-button type="primary" @click="submitForm">确定</el-button><el-button @click="cancel">取消</el-button></template>
    </el-dialog>
  </div>
</template>
<script setup name="AiModelPolicy">
import { listModelPolicy, getModelPolicy, addModelPolicy, updateModelPolicy, delModelPolicy } from '@/api/ai/modelPolicy'
const { proxy } = getCurrentInstance()
const list = ref([]), loading = ref(true), showSearch = ref(true), open = ref(false), total = ref(0), title = ref('')
const ids = ref([]), single = ref(true), multiple = ref(true)
const data = reactive({ form: {}, queryParams: { pageNum: 1, pageSize: 10, modelConfigId: null, productType: null, userTier: null, enabled: null } })
const { queryParams, form } = toRefs(data)
function getList() { loading.value = true; listModelPolicy(queryParams.value).then(res => { list.value = res.rows; total.value = res.total; loading.value = false }) }
function reset() { form.value = { id: null, modelConfigId: null, productType: 'chat', userTier: 'free', priority: 0, dailyRequestLimit: null, dailyTokenLimit: null, dailyImageLimit: null, maxContextTokens: null, maxOutputTokens: null, fallbackModelConfigId: null, enabled: 'Y', configJson: null, remark: null }; proxy.resetForm('formRef') }
function cancel() { open.value = false; reset() }
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }
function handleSelectionChange(selection) { ids.value = selection.map(item => item.id); single.value = selection.length !== 1; multiple.value = !selection.length }
function handleAdd() { reset(); open.value = true; title.value = '新增模型策略' }
function handleUpdate(row) { reset(); getModelPolicy(row.id || ids.value[0]).then(res => { form.value = res; open.value = true; title.value = '修改模型策略' }) }
function submitForm() { const action = form.value.id ? updateModelPolicy : addModelPolicy; action(form.value).then(() => { proxy.$modal.msgSuccess('保存成功'); open.value = false; getList() }) }
function handleDelete(row) { const deleteIds = row.id || ids.value; proxy.$modal.confirm(`确认删除编号为 "${deleteIds}" 的数据项？`).then(() => delModelPolicy(deleteIds)).then(() => { getList(); proxy.$modal.msgSuccess('删除成功') }).catch(() => {}) }
getList()
</script>
