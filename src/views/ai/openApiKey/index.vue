<template>
  <div class="app-container">
    <el-form ref="queryRef" :model="queryParams" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="名称" prop="name">
        <el-input v-model="queryParams.name" placeholder="请输入名称" clearable style="width: 220px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="前缀" prop="keyPrefix">
        <el-input v-model="queryParams.keyPrefix" placeholder="请输入Key前缀" clearable style="width: 220px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="启用" prop="enabled">
        <el-select v-model="queryParams.enabled" clearable style="width: 160px" placeholder="请选择">
          <el-option label="启用" value="Y" />
          <el-option label="禁用" value="N" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" clearable style="width: 160px" placeholder="请选择">
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
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['ai:openApiKey:add']">生成Key</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate" v-hasPermi="['ai:openApiKey:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['ai:openApiKey:remove']">删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="openApiKeyList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="ID" prop="id" align="center" width="80" />
      <el-table-column label="名称" prop="name" align="center" min-width="160" show-overflow-tooltip />
      <el-table-column label="Key前缀" prop="keyPrefix" align="center" width="180" show-overflow-tooltip />
      <el-table-column label="允许模型" prop="allowedModels" align="center" min-width="200" show-overflow-tooltip />
      <el-table-column label="启用" prop="enabled" align="center" width="80">
        <template #default="scope">
          <dict-tag :options="enabledOptions" :value="scope.row.enabled" />
        </template>
      </el-table-column>
      <el-table-column label="状态" prop="status" align="center" width="80">
        <template #default="scope">
          <el-tag :type="scope.row.status === '0' ? 'success' : 'danger'">{{ scope.row.status === '0' ? '正常' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="请求数" prop="requestCount" align="center" width="100" />
      <el-table-column label="成功数" prop="successCount" align="center" width="100" />
      <el-table-column label="失败数" prop="failedCount" align="center" width="100" />
      <el-table-column label="输入Token" prop="inputTokens" align="center" width="120" />
      <el-table-column label="输出Token" prop="outputTokens" align="center" width="120" />
      <el-table-column label="总Token" prop="totalTokens" align="center" width="120" />
      <el-table-column label="最后使用时间" prop="lastUsedAt" align="center" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.lastUsedAt, '{y}-{m}-{d} {h}:{i}:{s}') || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="过期时间" prop="expiresAt" align="center" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.expiresAt, '{y}-{m}-{d} {h}:{i}:{s}') || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" prop="createTime" align="center" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="180">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['ai:openApiKey:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['ai:openApiKey:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <el-dialog :title="title" v-model="open" width="680px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入API Key名称" />
        </el-form-item>
        <el-form-item label="允许模型" prop="allowedModels">
          <el-select
            v-model="selectedModels"
            multiple
            filterable
            clearable
            collapse-tags
            collapse-tags-tooltip
            placeholder="请选择允许访问的模型，留空表示不限制"
            style="width: 100%"
            :loading="modelOptionsLoading"
          >
            <template #header>
              <div class="select-actions">
                <el-button link type="primary" @click="handleSelectAllModels">全选</el-button>
                <el-button link @click="handleClearModels">清空</el-button>
              </div>
            </template>
            <el-option
              v-for="item in modelOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <div class="form-tip">留空表示不限制；支持多选和全选。</div>
        </el-form-item>
        <el-form-item label="过期时间" prop="expiresAt">
          <el-date-picker v-model="form.expiresAt" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择过期时间" style="width: 100%" clearable />
        </el-form-item>
        <el-form-item label="启用" prop="enabled">
          <el-radio-group v-model="form.enabled">
            <el-radio label="Y">启用</el-radio>
            <el-radio label="N">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" style="width: 100%" placeholder="请选择状态">
            <el-option label="正常" value="0" />
            <el-option label="停用" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog title="API Key 已生成" v-model="keyDialogVisible" width="720px" append-to-body>
      <el-alert title="明文 API Key 只展示这一次，请立即保存。后端不会再返回完整明文。" type="warning" :closable="false" show-icon />
      <el-input v-model="generatedApiKey" type="textarea" :rows="4" readonly style="margin-top: 16px" />
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="copyGeneratedKey">复制Key</el-button>
          <el-button @click="keyDialogVisible = false">关 闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="OpenApiKey">
import { ref, reactive, toRefs, getCurrentInstance } from 'vue'
import { parseTime } from '@/utils/ruoyi'
import { listOpenApiKey, getOpenApiKey, addOpenApiKey, updateOpenApiKey, delOpenApiKey } from '@/api/ai/openApiKey'
import { getAvailableChatModels } from '@/api/ai/modelConfig'

const { proxy } = getCurrentInstance()

const openApiKeyList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const ids = ref([])
const open = ref(false)
const title = ref('')
const keyDialogVisible = ref(false)
const generatedApiKey = ref('')
const selectedModels = ref([])
const modelOptions = ref([])
const modelOptionsLoading = ref(false)

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    name: null,
    keyPrefix: null,
    enabled: null,
    status: null
  },
  form: {},
  rules: {
    name: [
      { required: true, message: '名称不能为空', trigger: 'blur' }
    ],
    enabled: [
      { required: true, message: '启用状态不能为空', trigger: 'change' }
    ],
    status: [
      { required: true, message: '状态不能为空', trigger: 'change' }
    ]
  }
})

const { queryParams, form, rules } = toRefs(data)

const enabledOptions = ref([
  { label: '启用', value: 'Y' },
  { label: '禁用', value: 'N' }
])

function getList() {
  loading.value = true
  listOpenApiKey(queryParams.value).then(response => {
    openApiKeyList.value = response.rows
    total.value = response.total
    loading.value = false
  }).catch(() => {
    loading.value = false
  })
}

function reset() {
  form.value = {
    id: null,
    name: null,
    allowedModels: null,
    expiresAt: null,
    enabled: 'Y',
    status: '0',
    remark: null
  }
  selectedModels.value = []
  proxy.resetForm('formRef')
}

function parseAllowedModels(value) {
  if (!value) {
    return []
  }
  return value.split(',').map(item => item.trim()).filter(Boolean)
}

function syncAllowedModelsToForm() {
  form.value.allowedModels = selectedModels.value.length ? selectedModels.value.join(',') : null
}

function handleSelectAllModels() {
  selectedModels.value = modelOptions.value.map(item => item.value)
}

function handleClearModels() {
  selectedModels.value = []
}

function loadModelOptions() {
  if (modelOptions.value.length) {
    return Promise.resolve()
  }
  modelOptionsLoading.value = true
  return getAvailableChatModels().then(response => {
    const modelList = Array.isArray(response)
      ? response
      : (Array.isArray(response?.data) ? response.data : [])
    const uniqueModels = new Map()
    modelList.forEach(item => {
      if (!item?.model || uniqueModels.has(item.model)) {
        return
      }
      uniqueModels.set(item.model, {
        label: item.provider ? `${item.model} (${item.provider})` : item.model,
        value: item.model
      })
    })
    modelOptions.value = Array.from(uniqueModels.values())
  }).finally(() => {
    modelOptionsLoading.value = false
  })
}

function cancel() {
  open.value = false
  reset()
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
  ids.value = selection.map(item => item.id)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

function handleAdd() {
  reset()
  loadModelOptions().finally(() => {
    open.value = true
    title.value = '生成 Open API Key'
  })
}

function handleUpdate(row) {
  reset()
  const id = row.id || ids.value[0]
  loadModelOptions().finally(() => {
    getOpenApiKey(id).then(response => {
      form.value = response
      selectedModels.value = parseAllowedModels(response.allowedModels)
      open.value = true
      title.value = '修改 Open API Key'
    })
  })
}

function submitForm() {
  syncAllowedModelsToForm()
  proxy.$refs.formRef.validate(valid => {
    if (!valid) {
      return
    }
    if (form.value.id) {
      updateOpenApiKey(form.value).then(() => {
        proxy.$modal.msgSuccess('修改成功')
        open.value = false
        getList()
      })
      return
    }
    addOpenApiKey(form.value).then(response => {
      generatedApiKey.value = response.apiKey || ''
      keyDialogVisible.value = true
      proxy.$modal.msgSuccess('API Key生成成功')
      open.value = false
      getList()
    })
  })
}

function handleDelete(row) {
  const deleteIds = row.id ? [row.id] : ids.value
  proxy.$modal.confirm(`是否确认删除 API Key 编号为"${deleteIds}"的数据项？`).then(() => {
    return delOpenApiKey(deleteIds)
  }).then(() => {
    proxy.$modal.msgSuccess('删除成功')
    getList()
  }).catch(() => {})
}

function copyGeneratedKey() {
  navigator.clipboard.writeText(generatedApiKey.value).then(() => {
    proxy.$modal.msgSuccess('复制成功')
  }).catch(() => {
    proxy.$modal.msgWarning('复制失败，请手动复制')
  })
}

getList()
</script>

<style scoped>
.select-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-tip {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}
</style>
