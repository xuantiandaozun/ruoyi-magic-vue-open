<template>
  <div class="app-container">
    <el-form ref="queryRef" :model="queryParams" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="额度编码" prop="quotaCode"><el-input v-model="queryParams.quotaCode" clearable @keyup.enter="handleQuery" /></el-form-item>
      <el-form-item label="用户等级" prop="userTier"><el-input v-model="queryParams.userTier" clearable @keyup.enter="handleQuery" /></el-form-item>
      <el-form-item label="产品类型" prop="productType"><el-input v-model="queryParams.productType" clearable @keyup.enter="handleQuery" /></el-form-item>
      <el-form-item label="启用" prop="enabled">
        <el-select v-model="queryParams.enabled" clearable style="width: 120px">
          <el-option label="是" value="Y" /><el-option label="否" value="N" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['ai:usageQuota:add']">新增</el-button></el-col>
      <el-col :span="1.5"><el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate" v-hasPermi="['ai:usageQuota:edit']">修改</el-button></el-col>
      <el-col :span="1.5"><el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['ai:usageQuota:remove']">删除</el-button></el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="ID" prop="id" width="80" />
      <el-table-column label="额度编码" prop="quotaCode" min-width="160" show-overflow-tooltip />
      <el-table-column label="用户ID" prop="userId" width="100" />
      <el-table-column label="等级" prop="userTier" width="100" />
      <el-table-column label="产品" prop="productType" width="100" />
      <el-table-column label="周期" prop="quotaPeriod" width="100" />
      <el-table-column label="请求上限" prop="requestLimit" width="100" />
      <el-table-column label="Token上限" prop="tokenLimit" width="120" />
      <el-table-column label="图片上限" prop="imageLimit" width="100" />
      <el-table-column label="并发" prop="concurrentLimit" width="80" />
      <el-table-column label="启用" prop="enabled" width="80"><template #default="scope"><el-tag :type="scope.row.enabled === 'Y' ? 'success' : 'info'">{{ scope.row.enabled === 'Y' ? '是' : '否' }}</el-tag></template></el-table-column>
      <el-table-column label="操作" align="center" width="150" fixed="right">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['ai:usageQuota:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['ai:usageQuota:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="720px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="额度编码" prop="quotaCode"><el-input v-model="form.quotaCode" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="用户ID"><el-input-number v-model="form.userId" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="用户等级" prop="userTier"><el-input v-model="form.userTier" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="产品类型" prop="productType"><el-input v-model="form.productType" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="额度周期" prop="quotaPeriod"><el-input v-model="form.quotaPeriod" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="请求上限"><el-input-number v-model="form.requestLimit" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="Token上限"><el-input-number v-model="form.tokenLimit" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="图片上限"><el-input-number v-model="form.imageLimit" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="并发上限"><el-input-number v-model="form.concurrentLimit" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="成本上限"><el-input-number v-model="form.costLimit" :min="0" :precision="8" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="启用"><el-radio-group v-model="form.enabled"><el-radio label="Y">是</el-radio><el-radio label="N">否</el-radio></el-radio-group></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="备注"><el-input v-model="form.remark" type="textarea" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer><el-button type="primary" @click="submitForm">确定</el-button><el-button @click="cancel">取消</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup name="AiUsageQuota">
import { listUsageQuota, getUsageQuota, addUsageQuota, updateUsageQuota, delUsageQuota } from '@/api/ai/usageQuota'

const { proxy } = getCurrentInstance()
const list = ref([])
const loading = ref(true)
const showSearch = ref(true)
const open = ref(false)
const total = ref(0)
const title = ref('')
const ids = ref([])
const single = ref(true)
const multiple = ref(true)

const data = reactive({
  form: {},
  queryParams: { pageNum: 1, pageSize: 10, quotaCode: null, userTier: null, productType: null, enabled: null },
  rules: {
    quotaCode: [{ required: true, message: '额度编码不能为空', trigger: 'blur' }],
    userTier: [{ required: true, message: '用户等级不能为空', trigger: 'blur' }],
    productType: [{ required: true, message: '产品类型不能为空', trigger: 'blur' }],
    quotaPeriod: [{ required: true, message: '额度周期不能为空', trigger: 'blur' }]
  }
})
const { queryParams, form, rules } = toRefs(data)

function getList() { loading.value = true; listUsageQuota(queryParams.value).then(res => { list.value = res.rows; total.value = res.total; loading.value = false }) }
function reset() { form.value = { id: null, quotaCode: null, userId: null, userTier: 'free', productType: 'chat', quotaPeriod: 'daily', requestLimit: null, tokenLimit: null, imageLimit: null, concurrentLimit: null, costLimit: null, enabled: 'Y', remark: null }; proxy.resetForm('formRef') }
function cancel() { open.value = false; reset() }
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }
function handleSelectionChange(selection) { ids.value = selection.map(item => item.id); single.value = selection.length !== 1; multiple.value = !selection.length }
function handleAdd() { reset(); open.value = true; title.value = '新增AI用户额度' }
function handleUpdate(row) { reset(); getUsageQuota(row.id || ids.value[0]).then(res => { form.value = res; open.value = true; title.value = '修改AI用户额度' }) }
function submitForm() { proxy.$refs.formRef.validate(valid => { if (!valid) return; const action = form.value.id ? updateUsageQuota : addUsageQuota; action(form.value).then(() => { proxy.$modal.msgSuccess('保存成功'); open.value = false; getList() }) }) }
function handleDelete(row) { const deleteIds = row.id || ids.value; proxy.$modal.confirm(`确认删除编号为 "${deleteIds}" 的数据项？`).then(() => delUsageQuota(deleteIds)).then(() => { getList(); proxy.$modal.msgSuccess('删除成功') }).catch(() => {}) }

getList()
</script>
