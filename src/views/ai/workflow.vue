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
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="workflowList">
      <el-table-column label="工作流ID" align="center" prop="id" width="80" />
      <el-table-column label="工作流Key" align="center" prop="workflowKey" width="150" :show-overflow-tooltip="true" />
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
          <el-tag :type="scope.row.enabled === '1' ? 'success' : 'danger'">
            {{ scope.row.enabled === '1' ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="80">
        <template #default="scope">
          <dict-tag :options="sys_normal_disable" :value="scope.row.status"/>
        </template>
      </el-table-column>
      <el-table-column label="步骤数" align="center" prop="stepCount" width="80" />
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="240">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" v-hasPermi="['ai:workflow:query']">详情</el-button>
          <el-button link type="warning" icon="Timer" @click="handleSchedule(scope.row)" v-hasPermi="['ai:workflow:schedule:list']">定时</el-button>
          <el-button link type="info" icon="Document" @click="handleWorkflowLogs(scope.row)" v-hasPermi="['ai:workflow:schedule:log:list']">日志</el-button>
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

    <!-- 工作流详情对话框 -->
    <el-dialog title="工作流详情" v-model="detailOpen" width="800px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="工作流ID">{{ detailForm.id }}</el-descriptions-item>
        <el-descriptions-item label="工作流Key">{{ detailForm.workflowKey }}</el-descriptions-item>
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
        <el-descriptions-item label="步骤数">{{ detailForm.stepCount }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ detailForm.description }}</el-descriptions-item>
        <el-descriptions-item label="关联旧ID" :span="2" v-if="detailForm.legacyWorkflowIds">
          {{ detailForm.legacyWorkflowIds.join(', ') }}
        </el-descriptions-item>
      </el-descriptions>
      <el-table v-if="detailForm.steps && detailForm.steps.length" :data="detailForm.steps" border class="mt20">
        <el-table-column label="顺序" prop="order" width="80" align="center" />
        <el-table-column label="步骤ID" prop="id" width="180" :show-overflow-tooltip="true" />
        <el-table-column label="步骤名称" prop="name" :show-overflow-tooltip="true" />
        <el-table-column label="输出变量" prop="output" width="160" :show-overflow-tooltip="true" />
      </el-table>
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
                <span class="number">{{ scheduleStatistics.totalCount || 0 }}</span>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="box-card">
              <div class="card-header">
                <span>成功</span>
              </div>
              <div class="card-content">
                <span class="number text-success">{{ scheduleStatistics.successCount || 0 }}</span>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="box-card">
              <div class="card-header">
                <span>运行中</span>
              </div>
              <div class="card-content">
                <span class="number text-warning">{{ scheduleStatistics.runningCount || 0 }}</span>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="box-card">
              <div class="card-header">
                <span>失败</span>
              </div>
              <div class="card-content">
                <span class="number text-danger">{{ scheduleStatistics.failCount || 0 }}</span>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 操作按钮 -->
        <el-row class="mb-4">
          <el-col :span="24">
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
          <el-table-column label="操作" align="center" width="180">
            <template #default="scope">
              <el-button link type="primary" icon="CaretRight" @click="handleExecuteSchedule(scope.row)" v-hasPermi="['ai:workflow:schedule:execute']">立即执行</el-button>
              <el-button link type="info" icon="Document" @click="handleViewScheduleLogs(scope.row)" v-hasPermi="['ai:workflow:schedule:log:list']">日志</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
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
import { listWorkflows, getWorkflow } from "@/api/ai/workflow";
import { getWorkflowSchedules, executeWorkflowSchedule, getWorkflowScheduleStatistics } from "@/api/ai/workflowSchedule";

const { proxy } = getCurrentInstance();
const { sys_normal_disable } = proxy.useDict('sys_normal_disable');

const workflowList = ref([]);
const detailOpen = ref(false);
const scheduleOpen = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const scheduleTitle = ref("");

// 定时任务相关数据
const scheduleList = ref([]);
const scheduleLoading = ref(false);
const currentWorkflow = ref({});
const scheduleStatistics = ref({});

const data = reactive({
  detailForm: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    name: null,
    type: null,
    enabled: null,
  },
});

const { queryParams, detailForm } = toRefs(data);

/** 查询工作流列表 */
function getList() {
  loading.value = true;
  listWorkflows(queryParams.value).then(response => {
    workflowList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
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

/** 查看工作流执行日志 */
function handleWorkflowLogs(row) {
  proxy.$router.push({
    path: '/aiManage/workflow-schedule-log',
    query: { workflowId: row.id }
  });
}

/** 步骤管理按钮操作 */
function handleSteps(row) {
  proxy.$router.push({
    path: '/aiManage/workflowStep',
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

/** 立即执行定时任务 */
function handleExecuteSchedule(row) {
  executeWorkflowSchedule(currentWorkflow.value.id, row.id).then(() => {
    proxy.$modal.msgSuccess("执行成功");
    getScheduleList();
  });
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
  const workflowId = currentWorkflow.value.id;
  // 先关闭定时任务管理弹窗
  closeScheduleDialog();
  // 然后跳转到日志页面
  proxy.$router.push({ 
    path: '/aiManage/workflow-schedule-log', 
    query: { workflowId } 
  });
}

/** 查看特定调度任务的日志 */
function handleViewScheduleLogs(row) {
  const workflowId = currentWorkflow.value.id;
  // 先关闭定时任务管理弹窗
  closeScheduleDialog();
  // 然后跳转到日志页面
  proxy.$router.push({ 
    path: '/aiManage/workflow-schedule-log', 
    query: { 
      scheduleId: row.id,
      workflowId
    } 
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
