<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="auto">
      <el-form-item label="应用名称" prop="appName">
        <el-input v-model="queryParams.appName" placeholder="请输入应用名称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="AppCode" prop="appCode">
        <el-input v-model="queryParams.appCode" placeholder="请输入AppCode" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="平台" prop="platform">
        <el-select v-model="queryParams.platform" placeholder="请选择平台" clearable>
          <el-option label="微信小程序" value="wx_miniapp" />
          <el-option label="支付宝小程序" value="ali_miniapp" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
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
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['manage:miniapp:add']">新增</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="dataList">
      <el-table-column label="ID" align="center" prop="id" width="80" />
      <el-table-column label="应用名称" align="center" prop="appName" />
      <el-table-column label="AppCode" align="center" prop="appCode" />
      <el-table-column label="平台" align="center" prop="platform">
        <template #default="scope">
          <el-tag v-if="scope.row.platform === 'wechat_ma' || scope.row.platform === 'wx_miniapp'" type="success">微信小程序</el-tag>
          <el-tag v-else-if="scope.row.platform === 'ali_miniapp'" type="primary">支付宝小程序</el-tag>
          <span v-else>{{ scope.row.platform }}</span>
        </template>
      </el-table-column>
      <el-table-column label="AppID" align="center" prop="appId" show-overflow-tooltip />
      <el-table-column label="启用" align="center" prop="enabled">
        <template #default="scope">
          <el-tag v-if="scope.row.enabled === 'Y'" type="success">启用</el-tag>
          <el-tag v-else type="info">禁用</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <el-tag v-if="scope.row.status === '0'" type="success">正常</el-tag>
          <el-tag v-else type="danger">停用</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="160" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="180">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['manage:miniapp:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['manage:miniapp:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="应用名称" prop="appName">
          <el-input v-model="form.appName" placeholder="请输入应用名称" />
        </el-form-item>
        <el-form-item label="AppCode" prop="appCode">
          <el-input v-model="form.appCode" placeholder="唯一标识，如 billapp" />
        </el-form-item>
        <el-form-item label="平台" prop="platform">
          <el-select v-model="form.platform" placeholder="请选择平台" style="width:100%">
            <el-option label="微信小程序" value="wechat_ma" />
            <el-option label="支付宝小程序" value="ali_miniapp" />
          </el-select>
        </el-form-item>
        <el-form-item label="AppID" prop="appId">
          <el-input v-model="form.appId" placeholder="请输入AppID" />
        </el-form-item>
        <el-form-item label="AppSecret" prop="appSecret">
          <el-input v-model="form.appSecret" placeholder="请输入AppSecret" type="password" show-password />
        </el-form-item>
        <el-form-item label="Token" prop="token">
          <el-input v-model="form.token" placeholder="消息推送Token(可选)" />
        </el-form-item>
        <el-form-item label="AES Key" prop="aesKey">
          <el-input v-model="form.aesKey" placeholder="消息加密AES Key(可选)" />
        </el-form-item>
        <el-form-item label="启用" prop="enabled">
          <el-radio-group v-model="form.enabled">
            <el-radio label="Y">启用</el-radio>
            <el-radio label="N">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="0">正常</el-radio>
            <el-radio label="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancel">取 消</el-button>
          <el-button type="primary" @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="MiniAppConfig">
import { addMiniApp, delMiniApp, getMiniApp, listMiniApp, updateMiniApp } from '@/api/miniapp/appConfig'

const { proxy } = getCurrentInstance()
const dataList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const title = ref('')

const data = reactive({
  form: {},
  queryParams: { pageNum: 1, pageSize: 10, appName: null, appCode: null, platform: null, status: null },
  rules: {
    appName: [{ required: true, message: '应用名称不能为空', trigger: 'blur' }],
    appCode: [{ required: true, message: 'AppCode不能为空', trigger: 'blur' }],
    platform: [{ required: true, message: '请选择平台', trigger: 'change' }],
    appId: [{ required: true, message: 'AppID不能为空', trigger: 'blur' }],
    appSecret: [{ required: true, message: 'AppSecret不能为空', trigger: 'blur' }]
  }
})
const { queryParams, form, rules } = toRefs(data)

function getList() {
  loading.value = true
  listMiniApp(queryParams.value).then(res => {
    dataList.value = res.rows
    total.value = res.total
    loading.value = false
  })
}

function cancel() { open.value = false; reset() }

function reset() {
  form.value = { id: null, appName: null, appCode: null, platform: 'wechat_ma', appId: null, appSecret: null, token: null, aesKey: null, enabled: 'Y', status: '0' }
  proxy.resetForm('formRef')
}

function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }

function handleAdd() { reset(); open.value = true; title.value = '新增小程序配置' }

function handleUpdate(row) {
  reset()
  getMiniApp(row.id).then(response => {
    form.value = response
    open.value = true
    title.value = '修改小程序配置'
  })
}

function submitForm() {
  proxy.$refs['formRef'].validate(valid => {
    if (valid) {
      if (form.value.id != null) {
        updateMiniApp(form.value).then(() => { proxy.$modal.msgSuccess('修改成功'); open.value = false; getList() })
      } else {
        addMiniApp(form.value).then(() => { proxy.$modal.msgSuccess('新增成功'); open.value = false; getList() })
      }
    }
  })
}

function handleDelete(row) {
  proxy.$modal.confirm(`是否确认删除小程序"${row.appName}"？`).then(() => delMiniApp(row.id)).then(() => { getList(); proxy.$modal.msgSuccess('删除成功') }).catch(() => {})
}

onMounted(() => { getList() })
</script>
