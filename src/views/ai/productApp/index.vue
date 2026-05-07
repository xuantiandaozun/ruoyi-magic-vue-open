<template>
  <div class="app-container">
    <el-form ref="queryRef" :model="queryParams" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="应用编码" prop="appCode"><el-input v-model="queryParams.appCode" clearable @keyup.enter="handleQuery" /></el-form-item>
      <el-form-item label="应用名称" prop="appName"><el-input v-model="queryParams.appName" clearable @keyup.enter="handleQuery" /></el-form-item>
      <el-form-item label="产品类型" prop="productType"><el-input v-model="queryParams.productType" clearable @keyup.enter="handleQuery" /></el-form-item>
      <el-form-item><el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button><el-button icon="Refresh" @click="resetQuery">重置</el-button></el-form-item>
    </el-form>
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['ai:productApp:add']">新增</el-button></el-col>
      <el-col :span="1.5"><el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate" v-hasPermi="['ai:productApp:edit']">修改</el-button></el-col>
      <el-col :span="1.5"><el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['ai:productApp:remove']">删除</el-button></el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>
    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" />
      <el-table-column label="ID" prop="id" width="80" />
      <el-table-column label="应用编码" prop="appCode" min-width="140" />
      <el-table-column label="应用名称" prop="appName" min-width="140" />
      <el-table-column label="产品类型" prop="productType" width="120" />
      <el-table-column label="默认路由" prop="defaultRouteCode" min-width="140" />
      <el-table-column label="公开" prop="publicAccess" width="80" />
      <el-table-column label="RAG" prop="ragEnabled" width="80" />
      <el-table-column label="启用" prop="enabled" width="80"><template #default="scope"><el-tag :type="scope.row.enabled === 'Y' ? 'success' : 'info'">{{ scope.row.enabled === 'Y' ? '是' : '否' }}</el-tag></template></el-table-column>
      <el-table-column label="操作" width="150" fixed="right"><template #default="scope"><el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['ai:productApp:edit']">修改</el-button><el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['ai:productApp:remove']">删除</el-button></template></el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    <el-dialog :title="title" v-model="open" width="760px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="应用编码" prop="appCode"><el-input v-model="form.appCode" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="应用名称" prop="appName"><el-input v-model="form.appName" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="产品类型" prop="productType"><el-input v-model="form.productType" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="默认路由"><el-input v-model="form.defaultRouteCode" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="公开访问"><el-radio-group v-model="form.publicAccess"><el-radio label="Y">是</el-radio><el-radio label="N">否</el-radio></el-radio-group></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="启用RAG"><el-radio-group v-model="form.ragEnabled"><el-radio label="Y">是</el-radio><el-radio label="N">否</el-radio></el-radio-group></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="启用"><el-radio-group v-model="form.enabled"><el-radio label="Y">是</el-radio><el-radio label="N">否</el-radio></el-radio-group></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="RAG配置"><el-input v-model="form.ragConfigJson" type="textarea" :rows="3" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="应用配置"><el-input v-model="form.configJson" type="textarea" :rows="3" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="备注"><el-input v-model="form.remark" type="textarea" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer><el-button type="primary" @click="submitForm">确定</el-button><el-button @click="cancel">取消</el-button></template>
    </el-dialog>
  </div>
</template>
<script setup name="AiProductApp">
import { listProductApp, getProductApp, addProductApp, updateProductApp, delProductApp } from '@/api/ai/productApp'
const { proxy } = getCurrentInstance()
const list = ref([]), loading = ref(true), showSearch = ref(true), open = ref(false), total = ref(0), title = ref('')
const ids = ref([]), single = ref(true), multiple = ref(true)
const data = reactive({ form: {}, queryParams: { pageNum: 1, pageSize: 10, appCode: null, appName: null, productType: null }, rules: { appCode: [{ required: true, message: '应用编码不能为空', trigger: 'blur' }], appName: [{ required: true, message: '应用名称不能为空', trigger: 'blur' }], productType: [{ required: true, message: '产品类型不能为空', trigger: 'blur' }] } })
const { queryParams, form, rules } = toRefs(data)
function getList() { loading.value = true; listProductApp(queryParams.value).then(res => { list.value = res.rows; total.value = res.total; loading.value = false }) }
function reset() { form.value = { id: null, appCode: null, appName: null, productType: 'chat', defaultRouteCode: null, publicAccess: 'N', ragEnabled: 'N', ragConfigJson: null, configJson: null, enabled: 'Y', remark: null }; proxy.resetForm('formRef') }
function cancel() { open.value = false; reset() }
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }
function handleSelectionChange(selection) { ids.value = selection.map(item => item.id); single.value = selection.length !== 1; multiple.value = !selection.length }
function handleAdd() { reset(); open.value = true; title.value = '新增AI产品应用' }
function handleUpdate(row) { reset(); getProductApp(row.id || ids.value[0]).then(res => { form.value = res; open.value = true; title.value = '修改AI产品应用' }) }
function submitForm() { proxy.$refs.formRef.validate(valid => { if (!valid) return; const action = form.value.id ? updateProductApp : addProductApp; action(form.value).then(() => { proxy.$modal.msgSuccess('保存成功'); open.value = false; getList() }) }) }
function handleDelete(row) { const deleteIds = row.id || ids.value; proxy.$modal.confirm(`确认删除编号为 "${deleteIds}" 的数据项？`).then(() => delProductApp(deleteIds)).then(() => { getList(); proxy.$modal.msgSuccess('删除成功') }).catch(() => {}) }
getList()
</script>
