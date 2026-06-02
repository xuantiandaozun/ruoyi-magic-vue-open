<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="auto">
      <el-form-item label="AppCode" prop="appCode">
        <el-input v-model="queryParams.appCode" placeholder="请输入AppCode" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="场景码" prop="sceneCode">
        <el-input v-model="queryParams.sceneCode" placeholder="请输入场景码" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="启用状态" prop="enabled">
        <el-select v-model="queryParams.enabled" placeholder="请选择" clearable>
          <el-option label="启用" value="1" />
          <el-option label="禁用" value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['manage:miniSubscribeTemplate:add']">新增</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="dataList">
      <el-table-column label="ID" align="center" prop="id" width="80" />
      <el-table-column label="AppCode" align="center" prop="appCode" width="130" />
      <el-table-column label="场景码" align="center" prop="sceneCode" width="130" />
      <el-table-column label="模板标题" align="center" prop="title" show-overflow-tooltip />
      <el-table-column label="模板ID" align="center" prop="templateId" show-overflow-tooltip width="180" />
      <el-table-column label="跳转路径" align="center" prop="pagePath" show-overflow-tooltip width="160" />
      <el-table-column label="排序" align="center" prop="sortOrder" width="80" />
      <el-table-column label="启用" align="center" prop="enabled" width="80">
        <template #default="scope">
          <el-tag v-if="scope.row.enabled === 'Y'" type="success">启用</el-tag>
          <el-tag v-else type="info">禁用</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="160">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['manage:miniSubscribeTemplate:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['manage:miniSubscribeTemplate:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="640px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="AppCode" prop="appCode">
          <el-input v-model="form.appCode" placeholder="请输入AppCode" />
        </el-form-item>
        <el-form-item label="场景码" prop="sceneCode">
          <el-input v-model="form.sceneCode" placeholder="请输入场景码" />
        </el-form-item>
        <el-form-item label="模板标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入模板标题" />
        </el-form-item>
        <el-form-item label="模板ID" prop="templateId">
          <el-input v-model="form.templateId" placeholder="微信后台订阅消息模板ID" />
        </el-form-item>
        <el-form-item label="模板编号" prop="templateNo">
          <el-input v-model="form.templateNo" placeholder="可选模板编号" />
        </el-form-item>
        <el-form-item label="跳转路径" prop="pagePath">
          <el-input v-model="form.pagePath" placeholder="点击消息跳转的页面路径" />
        </el-form-item>
        <el-form-item label="字段配置" prop="fieldConfigJson">
          <el-input v-model="form.fieldConfigJson" type="textarea" :rows="3" placeholder="字段配置JSON" />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" controls-position="right" :min="0" />
        </el-form-item>
        <el-form-item label="启用" prop="enabled">
          <el-radio-group v-model="form.enabled">
            <el-radio label="Y">启用</el-radio>
            <el-radio label="N">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancel">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="MiniSubscribeTemplate">
import { addSubscribeTemplate, delSubscribeTemplate, getSubscribeTemplate, listSubscribeTemplate, updateSubscribeTemplate } from '@/api/miniapp/subscribeTemplate'

const { proxy } = getCurrentInstance()
const dataList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const title = ref('')

const data = reactive({
  form: {},
  queryParams: { pageNum: 1, pageSize: 10, appCode: null, sceneCode: null, enabled: null },
  rules: {
    appCode: [{ required: true, message: 'AppCode不能为空', trigger: 'blur' }],
    sceneCode: [{ required: true, message: '场景码不能为空', trigger: 'blur' }],
    title: [{ required: true, message: '模板标题不能为空', trigger: 'blur' }],
    templateId: [{ required: true, message: '模板ID不能为空', trigger: 'blur' }]
  }
})
const { queryParams, form, rules } = toRefs(data)

function getList() {
  loading.value = true
  listSubscribeTemplate(queryParams.value).then(res => {
    dataList.value = res.rows
    total.value = res.total
    loading.value = false
  })
}

function cancel() { open.value = false; reset() }
function reset() {
  form.value = { id: null, appCode: null, sceneCode: null, title: null, templateId: null, templateNo: null, pagePath: null, fieldConfigJson: null, sortOrder: 0, enabled: 'Y' }
  proxy.resetForm('formRef')
}

function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }
function handleAdd() { reset(); open.value = true; title.value = '新增订阅消息模板' }

function handleUpdate(row) {
  reset()
  getSubscribeTemplate(row.id).then(response => {
    form.value = response
    open.value = true
    title.value = '修改订阅消息模板'
  })
}

function submitForm() {
  proxy.$refs['formRef'].validate(valid => {
    if (valid) {
      if (form.value.id != null) {
        updateSubscribeTemplate(form.value).then(() => { proxy.$modal.msgSuccess('修改成功'); open.value = false; getList() })
      } else {
        addSubscribeTemplate(form.value).then(() => { proxy.$modal.msgSuccess('新增成功'); open.value = false; getList() })
      }
    }
  })
}

function handleDelete(row) {
  proxy.$modal.confirm(`是否确认删除模板"${row.title}"？`).then(() => delSubscribeTemplate(row.id)).then(() => { getList(); proxy.$modal.msgSuccess('删除成功') }).catch(() => {})
}

onMounted(() => { getList() })
</script>
