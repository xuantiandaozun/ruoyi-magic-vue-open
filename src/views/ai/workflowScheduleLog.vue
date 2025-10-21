<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="调度ID" prop="scheduleId">
        <el-input
          v-model="queryParams.scheduleId"
          placeholder="请输入调度ID"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="工作流ID" prop="workflowId">
        <el-input
          v-model="queryParams.workflowId"
          placeholder="请输入工作流ID"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="执行状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择执行状态" clearable>
          <el-option label="已完成" value="completed" />
          <el-option label="失败" value="failed" />
          <el-option label="运行中" value="running" />
          <el-option label="超时" value="timeout" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
      </el-form-item>
      <el-form-item label="触发类型" prop="triggerType">
        <el-select v-model="queryParams.triggerType" placeholder="请选择触发类型" clearable>
          <el-option label="定时触发" value="scheduled" />
          <el-option label="手动触发" value="manual" />
        </el-select>
      </el-form-item>
      <el-form-item label="执行时间">
        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD HH:mm:ss"
        ></el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['ai:workflow:schedule:log:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Delete"
          @click="handleCleanExpired"
          v-hasPermi="['ai:workflow:schedule:log:remove']"
        >清理过期日志</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="info"
          plain
          icon="TrendCharts"
          @click="handleStatistics"
        >统计分析</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="logList" @selection-change="handleSelectionChange" border>
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="日志ID" prop="id" width="80" />
      <el-table-column label="调度名称" prop="scheduleName" />
      <el-table-column label="工作流名称" prop="workflowName" />
      <el-table-column label="执行状态" align="center" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 'completed'" type="success">已完成</el-tag>
          <el-tag v-else-if="scope.row.status === 'failed'" type="danger">失败</el-tag>
          <el-tag v-else-if="scope.row.status === 'running'" type="warning">运行中</el-tag>
          <el-tag v-else-if="scope.row.status === 'timeout'" type="info">超时</el-tag>
          <el-tag v-else-if="scope.row.status === 'cancelled'" type="info">已取消</el-tag>
          <el-tag v-else type="info">{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="触发类型" align="center" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.triggerType === 'scheduled'" type="success">定时触发</el-tag>
          <el-tag v-else-if="scope.row.triggerType === 'manual'" type="warning">手动触发</el-tag>
          <el-tag v-else type="info">{{ scope.row.triggerType }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="开始时间" prop="actualStartTime" width="180">
        <template #default="scope">
          {{ parseTime(scope.row.actualStartTime) }}
        </template>
      </el-table-column>
      <el-table-column label="结束时间" prop="actualEndTime" width="180">
        <template #default="scope">
          {{ parseTime(scope.row.actualEndTime) }}
        </template>
      </el-table-column>
      <el-table-column label="执行时长" align="center" width="100">
        <template #default="scope">
          {{ scope.row.executionDuration ? scope.row.executionDuration + 'ms' : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="150">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" v-hasPermi="['ai:workflow:schedule:log:query']">详情</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['ai:workflow:schedule:log:remove']">删除</el-button>
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

    <!-- 日志详情对话框 -->
    <el-dialog title="执行日志详情" v-model="detailOpen" width="800px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="日志ID">{{ detailForm.id }}</el-descriptions-item>
        <el-descriptions-item label="调度ID">{{ detailForm.scheduleId }}</el-descriptions-item>
        <el-descriptions-item label="调度名称">{{ detailForm.scheduleName }}</el-descriptions-item>
        <el-descriptions-item label="工作流ID">{{ detailForm.workflowId }}</el-descriptions-item>
        <el-descriptions-item label="工作流名称">{{ detailForm.workflowName }}</el-descriptions-item>
        <el-descriptions-item label="执行状态">
          <el-tag v-if="detailForm.status === 'completed'" type="success">已完成</el-tag>
          <el-tag v-else-if="detailForm.status === 'failed'" type="danger">失败</el-tag>
          <el-tag v-else-if="detailForm.status === 'running'" type="warning">运行中</el-tag>
          <el-tag v-else-if="detailForm.status === 'timeout'" type="info">超时</el-tag>
          <el-tag v-else-if="detailForm.status === 'cancelled'" type="info">已取消</el-tag>
          <el-tag v-else type="info">{{ detailForm.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="触发类型">
          <el-tag v-if="detailForm.triggerType === 'scheduled'" type="success">定时触发</el-tag>
          <el-tag v-else-if="detailForm.triggerType === 'manual'" type="warning">手动触发</el-tag>
          <el-tag v-else type="info">{{ detailForm.triggerType }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ parseTime(detailForm.actualStartTime) }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ parseTime(detailForm.actualEndTime) }}</el-descriptions-item>
        <el-descriptions-item label="执行时长">{{ detailForm.executionDuration ? detailForm.executionDuration + 'ms' : '-' }}</el-descriptions-item>
        <el-descriptions-item label="输入数据" :span="2" v-if="detailForm.inputData">
          <pre style="white-space: pre-wrap; word-break: break-all;">{{ detailForm.inputData }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="输出数据" :span="2" v-if="detailForm.outputData">
          <pre style="white-space: pre-wrap; word-break: break-all;">{{ detailForm.outputData }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="错误信息" :span="2" v-if="detailForm.errorMessage">
          <pre style="white-space: pre-wrap; word-break: break-all; color: #f56c6c;">{{ detailForm.errorMessage }}</pre>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 统计分析对话框 -->
    <el-dialog title="执行统计分析" v-model="statisticsOpen" width="600px" append-to-body>
      <el-form :model="statisticsForm" label-width="100px">
        <el-form-item label="统计周期">
          <el-date-picker
            v-model="statisticsDateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD HH:mm:ss"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="调度ID">
          <el-input v-model="statisticsForm.scheduleId" placeholder="可选，指定调度ID" />
        </el-form-item>
        <el-form-item label="工作流ID">
          <el-input v-model="statisticsForm.workflowId" placeholder="可选，指定工作流ID" />
        </el-form-item>
      </el-form>
      <el-row :gutter="20" v-if="statisticsData.totalCount > 0">
        <el-col :span="12">
          <el-card class="box-card">
            <div class="card-header">
              <span>总执行次数</span>
            </div>
            <div class="card-content">
              <span class="number">{{ statisticsData.totalCount || 0 }}</span>
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="box-card">
            <div class="card-header">
              <span>成功次数</span>
            </div>
            <div class="card-content">
              <span class="number text-success">{{ statisticsData.successCount || 0 }}</span>
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="box-card">
            <div class="card-header">
              <span>失败次数</span>
            </div>
            <div class="card-content">
              <span class="number text-danger">{{ statisticsData.failCount || 0 }}</span>
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="box-card">
            <div class="card-header">
              <span>成功率</span>
            </div>
            <div class="card-content">
              <span class="number text-primary">{{ statisticsData.successRate || 0 }}%</span>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="getStatisticsData">查询统计</el-button>
          <el-button @click="statisticsOpen = false">关 闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 清理过期日志对话框 -->
    <el-dialog title="清理过期日志" v-model="cleanOpen" width="400px" append-to-body>
      <el-form :model="cleanForm" label-width="100px">
        <el-form-item label="保留天数" prop="days">
          <el-input-number v-model="cleanForm.days" :min="1" :max="365" />
          <div class="form-tip">
            <small>将删除指定天数之前的所有日志</small>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="danger" @click="confirmCleanExpired">确认清理</el-button>
          <el-button @click="cleanOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.box-card {
  text-align: center;
  border-radius: 8px;
  margin-bottom: 20px;
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

.text-primary {
  color: #409eff;
}

.form-tip {
  margin-top: 5px;
  color: #999;
}
</style>

<script setup name="WorkflowScheduleLog">
import { listScheduleLogs, getScheduleLog, delScheduleLog, cleanExpiredLogs, getLogStatistics } from "@/api/ai/workflowScheduleLog";

const { proxy } = getCurrentInstance();

const logList = ref([]);
const detailOpen = ref(false);
const statisticsOpen = ref(false);
const cleanOpen = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const dateRange = ref([]);
const statisticsDateRange = ref([]);

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    scheduleId: null,
    workflowId: null,
    status: null,
    triggerType: null,
    startTime: null,
    endTime: null
  },
  detailForm: {},
  statisticsForm: {
    scheduleId: null,
    workflowId: null,
    startTime: null,
    endTime: null
  },
  cleanForm: {
    days: 30
  }
});

const { queryParams, detailForm, statisticsForm, cleanForm } = toRefs(data);

const statisticsData = ref({});

/** 查询日志列表 */
function getList() {
  loading.value = true;
  if (dateRange.value && dateRange.value.length === 2) {
    queryParams.value.startTime = dateRange.value[0];
    queryParams.value.endTime = dateRange.value[1];
  } else {
    queryParams.value.startTime = null;
    queryParams.value.endTime = null;
  }
  
  listScheduleLogs(queryParams.value).then(response => {
    logList.value = response.rows;
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
  dateRange.value = [];
  proxy.resetForm("queryRef");
  handleQuery();
}

/** 多选框选中数据 */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 详情按钮操作 */
function handleDetail(row) {
  const logId = row.id || ids.value[0];
  getScheduleLog(logId).then(response => {
    detailForm.value = response;
    detailOpen.value = true;
  });
}

/** 删除按钮操作 */
function handleDelete(row) {
  const logIds = row.id ? [row.id] : ids.value;
  proxy.$modal.confirm('是否确认删除选中的执行日志？').then(function() {
    return delScheduleLog(logIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 清理过期日志 */
function handleCleanExpired() {
  cleanOpen.value = true;
}

/** 确认清理过期日志 */
function confirmCleanExpired() {
  proxy.$modal.confirm(`确认删除${cleanForm.value.days}天前的所有日志吗？此操作不可恢复！`).then(function() {
    return cleanExpiredLogs(cleanForm.value.days);
  }).then(() => {
    cleanOpen.value = false;
    getList();
    proxy.$modal.msgSuccess("清理成功");
  }).catch(() => {});
}

/** 统计分析 */
function handleStatistics() {
  statisticsOpen.value = true;
  statisticsData.value = {};
}

/** 获取统计数据 */
function getStatisticsData() {
  if (statisticsDateRange.value && statisticsDateRange.value.length === 2) {
    statisticsForm.value.startTime = statisticsDateRange.value[0];
    statisticsForm.value.endTime = statisticsDateRange.value[1];
  }
  
  getLogStatistics(statisticsForm.value).then(response => {
    statisticsData.value = response;
  });
}

// 初始化查询参数
onMounted(() => {
  const route = proxy.$route;
  if (route.query.scheduleId) {
    queryParams.value.scheduleId = route.query.scheduleId;
  }
  if (route.query.workflowId) {
    queryParams.value.workflowId = route.query.workflowId;
  }
  getList();
});
</script>