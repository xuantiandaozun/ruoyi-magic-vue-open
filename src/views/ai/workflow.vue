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
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="280">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" v-hasPermi="['ai:workflow:query']">详情</el-button>
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['ai:workflow:edit']">修改</el-button>
          <el-button link type="primary" icon="Setting" @click="handleSteps(scope.row)" v-hasPermi="['ai:workflow:list']">步骤</el-button>
          <el-button link type="warning" icon="Timer" @click="handleSchedule(scope.row)" v-hasPermi="['ai:workflow:schedule:list']">定时</el-button>
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

    <!-- 定时任务管理对话框 -->
    <el-dialog :title="scheduleTitle" v-model="scheduleOpen" width="1200px" append-to-body @close="closeScheduleDialog">
      <div class="schedule-management">
        <!-- 统计信息 -->
        <el-row :gutter="20" class="mb-4">
          <el-col :span="6">
            <el-card class="box-card">
              <div class="card-header">
                <span>总数</span>
              </div>
              <div class="card-content">
                <span class="number">{{ scheduleStatistics.total || 0 }}</span>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="box-card">
              <div class="card-header">
                <span>已启用</span>
              </div>
              <div class="card-content">
                <span class="number text-success">{{ scheduleStatistics.enabled || 0 }}</span>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="box-card">
              <div class="card-header">
                <span>运行中</span>
              </div>
              <div class="card-content">
                <span class="number text-warning">{{ scheduleStatistics.running || 0 }}</span>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="box-card">
              <div class="card-header">
                <span>已暂停</span>
              </div>
              <div class="card-content">
                <span class="number text-danger">{{ scheduleStatistics.paused || 0 }}</span>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 操作按钮 -->
        <el-row class="mb-4">
          <el-col :span="24">
            <el-button type="primary" icon="Plus" @click="handleAddSchedule" v-hasPermi="['ai:workflow:schedule:add']">新增定时任务</el-button>
            <el-button type="success" icon="VideoPlay" @click="handleEnableAllSchedules" v-hasPermi="['ai:workflow:schedule:edit']">启用全部</el-button>
            <el-button type="warning" icon="VideoPause" @click="handleDisableAllSchedules" v-hasPermi="['ai:workflow:schedule:edit']">禁用全部</el-button>
            <el-button type="info" icon="Document" @click="handleViewLogs" v-hasPermi="['ai:workflow:schedule:log:list']">查看日志</el-button>
          </el-col>
        </el-row>

        <!-- 定时任务列表 -->
        <el-table v-loading="scheduleLoading" :data="scheduleList" border>
          <el-table-column label="调度名称" prop="scheduleName" />
          <el-table-column label="Cron表达式" prop="cronExpression" />
          <el-table-column label="状态" align="center">
            <template #default="scope">
              <el-tag v-if="scope.row.status === '0'" type="success">正常</el-tag>
              <el-tag v-else-if="scope.row.status === '1'" type="warning">暂停</el-tag>
              <el-tag v-else type="info">{{ scope.row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="启用状态" align="center">
            <template #default="scope">
              <el-tag :type="scope.row.enabled === 'Y' ? 'success' : 'danger'">
                {{ scope.row.enabled === 'Y' ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="下次执行时间" prop="nextExecutionTime" width="180">
            <template #default="scope">
              {{ parseTime(scope.row.nextExecutionTime) }}
            </template>
          </el-table-column>
          <el-table-column label="上次执行时间" prop="lastExecutionTime" width="180">
            <template #default="scope">
              {{ parseTime(scope.row.lastExecutionTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="380">
            <template #default="scope">
              <el-button link type="primary" icon="Edit" @click="handleUpdateSchedule(scope.row)" v-hasPermi="['ai:workflow:schedule:edit']">修改</el-button>
              <el-button v-if="scope.row.status === '1'" link type="success" icon="VideoPlay" @click="handleStartSchedule(scope.row)" v-hasPermi="['ai:workflow:schedule:edit']">启动</el-button>
              <el-button v-if="scope.row.status === '0'" link type="warning" icon="VideoPause" @click="handlePauseSchedule(scope.row)" v-hasPermi="['ai:workflow:schedule:edit']">暂停</el-button>
              <el-button v-if="scope.row.status === '1'" link type="info" icon="Refresh" @click="handleResumeSchedule(scope.row)" v-hasPermi="['ai:workflow:schedule:edit']">恢复</el-button>
              <el-button link type="primary" icon="CaretRight" @click="handleExecuteSchedule(scope.row)" v-hasPermi="['ai:workflow:schedule:execute']">立即执行</el-button>
              <el-button link type="info" icon="Document" @click="handleViewScheduleLogs(scope.row)" v-hasPermi="['ai:workflow:schedule:log:list']">日志</el-button>
              <el-button link type="danger" icon="Delete" @click="handleDeleteSchedule(scope.row)" v-hasPermi="['ai:workflow:schedule:remove']">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <!-- 定时任务配置对话框 -->
    <el-dialog :title="scheduleForm.scheduleId ? '修改定时任务' : '新增定时任务'" v-model="scheduleFormOpen" width="600px" append-to-body>
      <el-form ref="scheduleRef" :model="scheduleForm" :rules="scheduleRules" label-width="120px">
        <el-form-item label="调度名称" prop="scheduleName">
          <el-input v-model="scheduleForm.scheduleName" placeholder="请输入调度名称" />
        </el-form-item>
        <el-form-item label="Cron表达式" prop="cronExpression">
          <el-input v-model="scheduleForm.cronExpression" placeholder="请输入Cron表达式，如：0 0 12 * * ?" />
          <div class="form-tip">
            <small>示例：0 0 12 * * ? (每天12点执行)</small>
          </div>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="scheduleForm.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="启用状态" prop="enabled">
          <el-radio-group v-model="scheduleForm.enabled">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="失火策略">
          <el-select v-model="scheduleForm.misfirePolicy" placeholder="请选择失火策略">
            <el-option label="立即执行" :value="1" />
            <el-option label="执行一次" :value="2" />
            <el-option label="放弃执行" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="并发执行">
          <el-radio-group v-model="scheduleForm.concurrent">
            <el-radio :label="1">允许</el-radio>
            <el-radio :label="0">禁止</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="重试次数">
          <el-input-number v-model="scheduleForm.retryCount" :min="0" :max="10" />
        </el-form-item>
        <el-form-item label="执行超时(秒)">
          <el-input-number v-model="scheduleForm.executionTimeout" :min="60" :max="86400" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-input-number v-model="scheduleForm.priority" :min="1" :max="10" />
        </el-form-item>
        <el-form-item label="输入数据">
          <el-input v-model="scheduleForm.inputData" type="textarea" :rows="4" placeholder="请输入JSON格式的输入数据（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitScheduleForm">确 定</el-button>
          <el-button @click="cancelSchedule">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.schedule-management {
  padding: 10px;
}

.box-card {
  text-align: center;
  border-radius: 8px;
}

.card-header {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.card-content {
  font-size: 24px;
  font-weight: bold;
}

.number {
  display: block;
}

.text-success {
  color: #67c23a;
}

.text-warning {
  color: #e6a23c;
}

.text-danger {
  color: #f56c6c;
}

.form-tip {
  margin-top: 5px;
  color: #999;
}

.mb-4 {
  margin-bottom: 20px;
}
</style>

<script setup name="AiWorkflow">
import { listWorkflows, getWorkflow, delWorkflow, addWorkflow, updateWorkflow, toggleWorkflowStatus } from "@/api/ai/workflow";
import { getWorkflowSchedules, createWorkflowSchedule, updateSchedule, enableAllWorkflowSchedules, disableAllWorkflowSchedules, getWorkflowScheduleStatistics } from "@/api/ai/workflowSchedule";
import { startSchedule, pauseSchedule, resumeSchedule, executeScheduleOnce, delSchedule } from "@/api/ai/workflowSchedule";

const { proxy } = getCurrentInstance();
const { sys_normal_disable } = proxy.useDict('sys_normal_disable');

const workflowList = ref([]);
const open = ref(false);
const detailOpen = ref(false);
const scheduleOpen = ref(false);
const scheduleFormOpen = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");
const scheduleTitle = ref("");

// 定时任务相关数据
const scheduleList = ref([]);
const scheduleLoading = ref(false);
const currentWorkflow = ref({});
const scheduleStatistics = ref({});

const data = reactive({
  form: {},
  detailForm: {},
  scheduleForm: {
    scheduleId: null,
    workflowId: null,
    scheduleName: null,
    cronExpression: null,
    description: null,
    enabled: 1,
    misfirePolicy: 1,
    concurrent: 0,
    retryCount: 0,
    executionTimeout: 3600,
    priority: 5,
    inputData: null
  },
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
  },
  scheduleRules: {
    scheduleName: [
      { required: true, message: "调度名称不能为空", trigger: "blur" }
    ],
    cronExpression: [
      { required: true, message: "Cron表达式不能为空", trigger: "blur" }
    ],
    enabled: [
      { required: true, message: "启用状态不能为空", trigger: "change" }
    ]
  }
});

const { queryParams, form, detailForm, scheduleForm, rules, scheduleRules } = toRefs(data);

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

// 定时任务表单重置
function resetScheduleForm() {
  scheduleForm.value = {
    scheduleId: null,
    workflowId: null,
    scheduleName: null,
    cronExpression: null,
    description: null,
    enabled: 1,
    misfirePolicy: 1,
    concurrent: 0,
    retryCount: 0,
    executionTimeout: 3600,
    priority: 5,
    inputData: null
  };
  proxy.resetForm("scheduleRef");
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

/** 打开定时任务管理对话框 */
function handleSchedule(row) {
  currentWorkflow.value = row;
  scheduleTitle.value = `${row.name} - 定时任务管理`;
  scheduleOpen.value = true;
  getScheduleList();
  getScheduleStats();
}

/** 获取定时任务列表 */
function getScheduleList() {
  scheduleLoading.value = true;
  getWorkflowSchedules(currentWorkflow.value.id).then(response => {
    scheduleList.value = response;
    scheduleLoading.value = false;
  }).catch(() => {
    scheduleLoading.value = false;
  });
}

/** 获取定时任务统计信息 */
function getScheduleStats() {
  getWorkflowScheduleStatistics(currentWorkflow.value.id).then(response => {
    scheduleStatistics.value = response;
  });
}

/** 新增定时任务 */
function handleAddSchedule() {
  resetScheduleForm();
  scheduleForm.value.workflowId = currentWorkflow.value.id;
  scheduleFormOpen.value = true;
}

/** 修改定时任务 */
function handleUpdateSchedule(row) {
  resetScheduleForm();
  // 映射后端返回的字段到表单字段
  scheduleForm.value = {
    scheduleId: row.id,
    workflowId: row.workflowId,
    scheduleName: row.scheduleName,
    cronExpression: row.cronExpression,
    description: row.remark, // 后端使用remark字段作为描述
    enabled: row.enabled === 'Y' ? 1 : 0, // 后端使用Y/N，前端表单使用1/0
    misfirePolicy: parseInt(row.misfirePolicy) || 1,
    concurrent: row.concurrent === 'Y' ? 1 : 0, // 后端使用Y/N，前端表单使用1/0
    retryCount: row.retryCount || 0,
    executionTimeout: row.executionTimeout || 3600,
    priority: row.priority || 5,
    inputData: row.inputDataTemplate
  };
  scheduleFormOpen.value = true;
}

/** 提交定时任务表单 */
function submitScheduleForm() {
  proxy.$refs["scheduleRef"].validate(valid => {
    if (valid) {
      // 转换前端表单数据为后端期望的格式
      const submitData = {
        id: scheduleForm.value.scheduleId,
        workflowId: scheduleForm.value.workflowId,
        scheduleName: scheduleForm.value.scheduleName,
        cronExpression: scheduleForm.value.cronExpression,
        remark: scheduleForm.value.description,
        enabled: scheduleForm.value.enabled === 1 ? 'Y' : 'N',
        misfirePolicy: String(scheduleForm.value.misfirePolicy),
        concurrent: scheduleForm.value.concurrent === 1 ? 'Y' : 'N',
        retryCount: scheduleForm.value.retryCount,
        executionTimeout: scheduleForm.value.executionTimeout,
        priority: scheduleForm.value.priority,
        inputDataTemplate: scheduleForm.value.inputData
      };

      if (scheduleForm.value.scheduleId != null) {
        updateSchedule(submitData).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          scheduleFormOpen.value = false;
          getScheduleList();
          getScheduleStats();
        });
      } else {
        createWorkflowSchedule(currentWorkflow.value.id, submitData).then(response => {
          proxy.$modal.msgSuccess("新增成功");
          scheduleFormOpen.value = false;
          getScheduleList();
          getScheduleStats();
        });
      }
    }
  });
}

/** 删除定时任务 */
function handleDeleteSchedule(row) {
  proxy.$modal.confirm('是否确认删除定时任务"' + row.scheduleName + '"？').then(function() {
    return delSchedule(row.id);
  }).then(() => {
    getScheduleList();
    getScheduleStats();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 启动定时任务 */
function handleStartSchedule(row) {
  startSchedule(row.id).then(() => {
    proxy.$modal.msgSuccess("启动成功");
    getScheduleList();
    getScheduleStats();
  });
}

/** 暂停定时任务 */
function handlePauseSchedule(row) {
  pauseSchedule(row.id).then(() => {
    proxy.$modal.msgSuccess("暂停成功");
    getScheduleList();
    getScheduleStats();
  });
}

/** 恢复定时任务 */
function handleResumeSchedule(row) {
  resumeSchedule(row.id).then(() => {
    proxy.$modal.msgSuccess("恢复成功");
    getScheduleList();
    getScheduleStats();
  });
}

/** 立即执行定时任务 */
function handleExecuteSchedule(row) {
  executeScheduleOnce(row.id).then(() => {
    proxy.$modal.msgSuccess("执行成功");
    getScheduleList();
  });
}

/** 启用所有定时任务 */
function handleEnableAllSchedules() {
  enableAllWorkflowSchedules(currentWorkflow.value.id).then(() => {
    proxy.$modal.msgSuccess("启用成功");
    getScheduleList();
    getScheduleStats();
  });
}

/** 禁用所有定时任务 */
function handleDisableAllSchedules() {
  disableAllWorkflowSchedules(currentWorkflow.value.id).then(() => {
    proxy.$modal.msgSuccess("禁用成功");
    getScheduleList();
    getScheduleStats();
  });
}

/** 取消定时任务表单 */
function cancelSchedule() {
  scheduleFormOpen.value = false;
  resetScheduleForm();
}

/** 关闭定时任务管理对话框 */
function closeScheduleDialog() {
  scheduleOpen.value = false;
  scheduleList.value = [];
  scheduleStatistics.value = {};
  currentWorkflow.value = {};
}

/** 查看执行日志 */
function handleViewLogs() {
  proxy.$router.push({ 
    path: '/ai/workflow-schedule-log', 
    query: { workflowId: currentWorkflow.value.id } 
  });
}

/** 查看特定调度任务的日志 */
function handleViewScheduleLogs(row) {
  proxy.$router.push({ 
    path: '/ai/workflow-schedule-log', 
    query: { 
      scheduleId: row.id,
      workflowId: currentWorkflow.value.id 
    } 
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