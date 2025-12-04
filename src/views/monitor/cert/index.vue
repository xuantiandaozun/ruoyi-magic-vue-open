<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="域名" prop="domain">
        <el-input
          v-model="queryParams.domain"
          placeholder="请输入域名"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
          <el-option label="正常" value="0" />
          <el-option label="即将过期" value="1" />
          <el-option label="已过期" value="2" />
          <el-option label="检测失败" value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="通知状态" prop="notifyEnabled">
        <el-select v-model="queryParams.notifyEnabled" placeholder="请选择通知状态" clearable>
          <el-option label="开启" value="1" />
          <el-option label="关闭" value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['monitor:cert:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Refresh"
          @click="handleCheckAll"
          v-hasPermi="['monitor:cert:check']"
          :loading="checkLoading"
        >检测全部</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['monitor:cert:remove']"
        >删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="domainCertList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="域名" align="center" prop="domain" min-width="180">
        <template #default="scope">
          <span>{{ scope.row.domain }}</span>
          <span v-if="scope.row.port && scope.row.port !== 443">:{{ scope.row.port }}</span>
        </template>
      </el-table-column>
      <el-table-column label="证书颁发者" align="center" prop="issuer" min-width="150" show-overflow-tooltip />
      <el-table-column label="过期时间" align="center" prop="expireTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.expireTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="剩余天数" align="center" prop="daysRemaining" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.daysRemaining !== null" :type="getDaysTagType(scope.row.daysRemaining)">
            {{ scope.row.daysRemaining }}天
          </el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <el-tag :type="getStatusTagType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="通知" align="center" prop="notifyEnabled" width="80">
        <template #default="scope">
          <el-switch
            v-model="scope.row.notifyEnabled"
            active-value="1"
            inactive-value="0"
            @change="handleNotifyChange(scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="提前通知" align="center" prop="notifyDays" width="90">
        <template #default="scope">
          {{ scope.row.notifyDays }}天
        </template>
      </el-table-column>
      <el-table-column label="最后检测" align="center" prop="lastCheckTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.lastCheckTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" min-width="120" show-overflow-tooltip />
      <el-table-column label="操作" align="center" width="250" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Refresh" @click="handleCheck(scope.row)" v-hasPermi="['monitor:cert:check']">检测</el-button>
          <el-button link type="warning" icon="Bell" @click="handleNotify(scope.row)" v-hasPermi="['monitor:cert:notify']">通知</el-button>
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['monitor:cert:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['monitor:cert:remove']">删除</el-button>
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

    <!-- 添加或修改域名证书监控对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="domainCertRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="域名" prop="domain">
          <el-input v-model="form.domain" placeholder="请输入域名，如：example.com" />
        </el-form-item>
        <el-form-item label="端口" prop="port">
          <el-input-number v-model="form.port" :min="1" :max="65535" placeholder="默认443" />
        </el-form-item>
        <el-form-item label="开启通知" prop="notifyEnabled">
          <el-switch
            v-model="form.notifyEnabled"
            active-value="1"
            inactive-value="0"
          />
        </el-form-item>
        <el-form-item label="提前通知天数" prop="notifyDays">
          <el-input-number v-model="form.notifyDays" :min="1" :max="90" placeholder="提前多少天通知" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="DomainCert">
import { addDomainCert, checkAllDomainCerts, checkDomainCert, delDomainCert, getDomainCert, listDomainCert, sendNotification, updateDomainCert } from "@/api/monitor/domainCert";

const { proxy } = getCurrentInstance();

const domainCertList = ref([]);
const open = ref(false);
const loading = ref(true);
const checkLoading = ref(false);
const notifyLoading = ref(false);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    domain: null,
    status: null,
    notifyEnabled: null
  },
  rules: {
    domain: [
      { required: true, message: "域名不能为空", trigger: "blur" },
      { pattern: /^[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/, message: "请输入正确的域名格式", trigger: "blur" }
    ],
    port: [
      { required: true, message: "端口不能为空", trigger: "blur" }
    ]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询域名证书监控列表 */
function getList() {
  loading.value = true;
  listDomainCert(queryParams.value).then(response => {
    domainCertList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

// 取消按钮
function cancel() {
  open.value = false;
  reset();
}

// 表单重置
function reset() {
  form.value = {
    id: null,
    domain: null,
    port: 443,
    notifyEnabled: "1",
    notifyDays: 3,
    remark: null
  };
  proxy.resetForm("domainCertRef");
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef");
  handleQuery();
}

// 多选框选中数据
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加域名证书监控";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const id = row.id || ids.value;
  getDomainCert(id).then(response => {
    form.value = response;
    open.value = true;
    title.value = "修改域名证书监控";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["domainCertRef"].validate(valid => {
    if (valid) {
      if (form.value.id != null) {
        updateDomainCert(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addDomainCert(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功");
          open.value = false;
          getList();
        });
      }
    }
  });
}

/** 删除按钮操作 */
function handleDelete(row) {
  const delIds = row.id || ids.value;
  proxy.$modal.confirm('是否确认删除域名证书监控编号为"' + delIds + '"的数据项？').then(function() {
    return delDomainCert(delIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 检测单个域名 */
function handleCheck(row) {
  proxy.$modal.confirm('是否确认检测域名"' + row.domain + '"的证书？').then(function() {
    return checkDomainCert(row.id);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("检测成功");
  }).catch(() => {});
}

/** 检测全部域名 */
function handleCheckAll() {
  proxy.$modal.confirm('是否确认检测所有域名的证书？').then(function() {
    checkLoading.value = true;
    return checkAllDomainCerts();
  }).then((response) => {
    getList();
    proxy.$modal.msgSuccess(response.msg);
  }).finally(() => {
    checkLoading.value = false;
  });
}

/** 发送指定域名的通知 */
function handleNotify(row) {
  proxy.$modal.confirm('是否确认发送域名"' + row.domain + '"的证书信息通知？').then(function() {
    return sendNotification(row.id);
  }).then((response) => {
    proxy.$modal.msgSuccess(response.msg);
  }).catch(() => {});
}

/** 通知状态修改 */
function handleNotifyChange(row) {
  let text = row.notifyEnabled === "1" ? "启用" : "停用";
  proxy.$modal.confirm('确认要' + text + '"' + row.domain + '"的通知吗？').then(function() {
    return updateDomainCert({ id: row.id, notifyEnabled: row.notifyEnabled });
  }).then(() => {
    proxy.$modal.msgSuccess(text + "成功");
  }).catch(function() {
    row.notifyEnabled = row.notifyEnabled === "0" ? "1" : "0";
  });
}

/** 获取剩余天数标签类型 */
function getDaysTagType(days) {
  if (days < 0) return 'danger';
  if (days <= 3) return 'danger';
  if (days <= 7) return 'warning';
  if (days <= 30) return 'info';
  return 'success';
}

/** 获取状态标签类型 */
function getStatusTagType(status) {
  switch(status) {
    case '0': return 'success';
    case '1': return 'warning';
    case '2': return 'danger';
    case '3': return 'info';
    default: return 'info';
  }
}

/** 获取状态文本 */
function getStatusText(status) {
  switch(status) {
    case '0': return '正常';
    case '1': return '即将过期';
    case '2': return '已过期';
    case '3': return '检测失败';
    default: return '未知';
  }
}

getList();
</script>
