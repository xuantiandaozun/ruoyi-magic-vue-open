<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="工作流名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入工作流名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="工作流类型" prop="type">
        <el-select v-model="queryParams.type" placeholder="请选择工作流类型" clearable>
          <el-option label="顺序工作流" value="sequential" />
        </el-select>
      </el-form-item>
      <el-form-item label="启用状态" prop="enabled">
        <el-select v-model="queryParams.enabled" placeholder="请选择启用状态" clearable>
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
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['ai:workflow:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['ai:workflow:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['ai:workflow:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['ai:workflow:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="workflowList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="工作流ID" align="center" prop="id" width="80" />
      <el-table-column label="工作流名称" align="center" prop="name" :show-overflow-tooltip="true" />
      <el-table-column label="描述" align="center" prop="description" :show-overflow-tooltip="true" />
      <el-table-column label="类型" align="center" prop="type">
        <template #default="scope">
          <el-tag v-if="scope.row.type === 'sequential'" type="primary">顺序工作流</el-tag>
          <el-tag v-else type="info">{{ scope.row.type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="版本" align="center" prop="version" width="80" />
      <el-table-column label="启用状态" align="center" prop="enabled" width="100">
        <template #default="scope">
          <el-switch
            v-model="scope.row.enabled"
            active-value="1"
            inactive-value="0"
            @change="handleStatusChange(scope.row)"
            v-hasPermi="['ai:workflow:edit']"
          />
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="80">
        <template #default="scope">
          <dict-tag :options="sys_normal_disable" :value="scope.row.status"/>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="200">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" v-hasPermi="['ai:workflow:query']">详情</el-button>
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['ai:workflow:edit']">修改</el-button>
          <el-button link type="primary" icon="Setting" @click="handleSteps(scope.row)" v-hasPermi="['ai:workflow:list']">步骤</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['ai:workflow:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <pagination
      v-show="total>0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改工作流对话框 -->
    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="workflowRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="工作流名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入工作流名称" />
        </el-form-item>
        <el-form-item label="工作流描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入工作流描述" />
        </el-form-item>
        <el-form-item label="工作流类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择工作流类型">
            <el-option label="顺序工作流" value="sequential" />
          </el-select>
        </el-form-item>
        <el-form-item label="版本" prop="version">
          <el-input v-model="form.version" placeholder="请输入版本号，如：1.0.0" />
        </el-form-item>
        <el-form-item label="启用状态" prop="enabled">
          <el-radio-group v-model="form.enabled">
            <el-radio label="1">启用</el-radio>
            <el-radio label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="0">正常</el-radio>
            <el-radio label="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="配置JSON" prop="configJson">
          <el-input v-model="form.configJson" type="textarea" :rows="4" placeholder="请输入配置JSON（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 工作流详情对话框 -->
    <el-dialog title="工作流详情" v-model="detailOpen" width="800px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="工作流ID">{{ detailForm.id }}</el-descriptions-item>
        <el-descriptions-item label="工作流名称">{{ detailForm.name }}</el-descriptions-item>
        <el-descriptions-item label="工作流类型">
          <el-tag v-if="detailForm.type === 'sequential'" type="primary">顺序工作流</el-tag>
          <el-tag v-else type="info">{{ detailForm.type }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="版本">{{ detailForm.version }}</el-descriptions-item>
        <el-descriptions-item label="启用状态">
          <el-tag :type="detailForm.enabled === '1' ? 'success' : 'danger'">
            {{ detailForm.enabled === '1' ? '启用' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <dict-tag :options="sys_normal_disable" :value="detailForm.status"/>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ parseTime(detailForm.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ parseTime(detailForm.updateTime) }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ detailForm.description }}</el-descriptions-item>
        <el-descriptions-item label="配置JSON" :span="2" v-if="detailForm.configJson">
          <pre style="white-space: pre-wrap; word-break: break-all;">{{ detailForm.configJson }}</pre>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup name="AiWorkflow">
import { listWorkflows, getWorkflow, delWorkflow, addWorkflow, updateWorkflow, toggleWorkflowStatus } from "@/api/ai/workflow";

const { proxy } = getCurrentInstance();
const { sys_normal_disable } = proxy.useDict('sys_normal_disable');

const workflowList = ref([]);
const open = ref(false);
const detailOpen = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");

const data = reactive({
  form: {},
  detailForm: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    name: null,
    type: null,
    enabled: null,
  },
  rules: {
    name: [
      { required: true, message: "工作流名称不能为空", trigger: "blur" }
    ],
    type: [
      { required: true, message: "工作流类型不能为空", trigger: "change" }
    ],
    version: [
      { required: true, message: "版本不能为空", trigger: "blur" }
    ],
    enabled: [
      { required: true, message: "启用状态不能为空", trigger: "change" }
    ],
    status: [
      { required: true, message: "状态不能为空", trigger: "change" }
    ]
  }
});

const { queryParams, form, detailForm, rules } = toRefs(data);

/** 查询工作流列表 */
function getList() {
  loading.value = true;
  listWorkflows(queryParams.value).then(response => {
    workflowList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

// 取消按钮
function cancel() {
  // 先重置表单，再关闭弹窗，避免关闭过程中 ref 未就绪导致错误
  reset();
  open.value = false;
}

// 表单重置
function reset() {
  form.value = {
    id: null,
    name: null,
    description: null,
    type: "sequential",
    version: "1.0.0",
    enabled: "1",
    status: "0",
    configJson: null
  };
  proxy.resetForm("workflowRef");
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
  title.value = "添加工作流";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  open.value = true;
  title.value = "修改工作流";
  // 若有行数据，先用其预填回显，提升体验
  if (row && row.id != null) {
    const r = row;
    form.value = {
      id: r.id ?? null,
      name: r.name ?? null,
      description: r.description ?? null,
      type: r.type ?? "sequential",
      version: r.version ?? "1.0.0",
      enabled: r.enabled != null ? String(r.enabled) : "1",
      status: r.status != null ? String(r.status) : "0",
      configJson: r.configJson ?? null
    };
  }

  const _id = (row && row.id) != null ? row.id : ids.value && ids.value.length ? ids.value[0] : null;
  if (_id == null) {
    proxy.$modal.msgError("请先选择一条要修改的记录");
    return;
  }
  getWorkflow(_id)
    .then(response => {
      // 响应拦截器已经处理了数据结构，response 就是实际的工作流对象
      const data = response || {};
      // 规范字段类型，确保回显正确
      form.value = {
        id: data.id ?? null,
        name: data.name ?? null,
        description: data.description ?? null,
        type: data.type ?? "sequential",
        version: data.version ?? "1.0.0",
        enabled: data.enabled != null ? String(data.enabled) : "1",
        status: data.status != null ? String(data.status) : "0",
        configJson: data.configJson ?? null
      };
    })
    .catch(err => {
      proxy.$modal.msgError("获取工作流详情失败: " + (err?.message || "未知错误"));
    });
}

/** 详情按钮操作 */
function handleDetail(row) {
  detailForm.value = {};
  detailOpen.value = true;
  const _id = row.id;
  getWorkflow(_id).then(response => {
    // 响应拦截器已经处理了数据结构，response 就是实际的工作流对象
    detailForm.value = response;
  });
}

/** 步骤管理按钮操作 */
function handleSteps(row) {
  proxy.$router.push({
    path: '/ai/workflowStep',
    query: { workflowId: row.id, workflowName: row.name }
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["workflowRef"].validate(valid => {
    if (valid) {
      if (form.value.id != null) {
        updateWorkflow(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addWorkflow(form.value).then(response => {
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
  const _ids = row.id || ids.value;
  proxy.$modal.confirm('是否确认删除工作流编号为"' + _ids + '"的数据项？').then(function() {
    return delWorkflow(_ids);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 启用/禁用状态切换 */
function handleStatusChange(row) {
  let text = row.enabled === "1" ? "启用" : "禁用";
  proxy.$modal.confirm('确认要"' + text + '""' + row.name + '"工作流吗？').then(function() {
    return toggleWorkflowStatus(row.id);
  }).then(() => {
    proxy.$modal.msgSuccess(text + "成功");
    getList();
  }).catch(function() {
    row.enabled = row.enabled === "0" ? "1" : "0";
  });
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('ai/workflow/export', {
    ...queryParams.value
  }, `workflow_${new Date().getTime()}.xlsx`)
}

onMounted(() => {
  getList();
});
</script>