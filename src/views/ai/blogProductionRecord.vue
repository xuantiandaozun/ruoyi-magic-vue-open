<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="仓库URL" prop="repoUrl">
        <el-input
          v-model="queryParams.repoUrl"
          placeholder="请输入仓库地址"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="仓库标题" prop="repoTitle">
        <el-input
          v-model="queryParams.repoTitle"
          placeholder="请输入仓库标题"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="生产类型" prop="productionType">
        <el-select v-model="queryParams.productionType" placeholder="请选择生产类型" clearable style="width: 200px">
          <el-option label="README分析" value="readme_analysis" />
          <el-option label="排行榜" value="ranking" />
          <el-option label="教程" value="tutorial" />
          <el-option label="趋势分析" value="trending_analysis" />
        </el-select>
      </el-form-item>
      <el-form-item label="生产状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择生产状态" clearable style="width: 200px">
          <el-option label="生产中" value="0" />
          <el-option label="成功" value="1" />
          <el-option label="失败" value="2" />
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
          v-hasPermi="['ai:blogProductionRecord:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['ai:blogProductionRecord:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['ai:blogProductionRecord:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['ai:blogProductionRecord:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="blogProductionRecordList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="仓库URL" align="center" prop="repoUrl" min-width="200" show-overflow-tooltip />
      <el-table-column label="仓库标题" align="center" prop="repoTitle" min-width="150" show-overflow-tooltip />
      <el-table-column label="生产类型" align="center" prop="productionType" width="120">
        <template #default="scope">
          <el-tag :type="productionTypeColor(scope.row.productionType)">
            {{ productionTypeLabel(scope.row.productionType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="生产状态" align="center" prop="status" width="100">
        <template #default="scope">
          <el-tag :type="statusColor(scope.row.status)">
            {{ statusLabel(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="AI模型" align="center" prop="aiModel" width="120" />
      <el-table-column label="生产时间" align="center" prop="productionTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.productionTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="180">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleView(scope.row)" v-hasPermi="['ai:blogProductionRecord:query']">查看</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['ai:blogProductionRecord:remove']">删除</el-button>
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

    <!-- 详情对话框 -->
    <el-dialog :title="'博客生产记录详情'" v-model="detailOpen" width="800px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="ID">{{ detailData.id }}</el-descriptions-item>
        <el-descriptions-item label="仓库URL">{{ detailData.repoUrl }}</el-descriptions-item>
        <el-descriptions-item label="仓库标题">{{ detailData.repoTitle }}</el-descriptions-item>
        <el-descriptions-item label="仓库所有者">{{ detailData.repoOwner }}</el-descriptions-item>
        <el-descriptions-item label="编程语言">{{ detailData.repoLanguage }}</el-descriptions-item>
        <el-descriptions-item label="生产类型">
          <el-tag :type="productionTypeColor(detailData.productionType)">
            {{ productionTypeLabel(detailData.productionType) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="生产状态">
          <el-tag :type="statusColor(detailData.status)">
            {{ statusLabel(detailData.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="AI模型">{{ detailData.aiModel }}</el-descriptions-item>
        <el-descriptions-item label="生产时间">{{ parseTime(detailData.productionTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ parseTime(detailData.completionTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</el-descriptions-item>
        <el-descriptions-item label="重试次数">{{ detailData.retryCount }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ parseTime(detailData.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</el-descriptions-item>
        <el-descriptions-item label="错误信息" :span="2">
          <el-text v-if="detailData.errorMessage" type="danger">{{ detailData.errorMessage }}</el-text>
          <el-text v-else type="success">无</el-text>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup name="BlogProductionRecord">
import { delBlogProductionRecord, listBlogProductionRecords } from "@/api/ai/blogProductionRecord";
import { parseTime } from "@/utils/ruoyi";
import { getCurrentInstance, reactive, ref, toRefs } from "vue";

const { proxy } = getCurrentInstance();

const blogProductionRecordList = ref([]);
const detailOpen = ref(false);
const detailData = ref({});
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    repoUrl: null,
    repoTitle: null,
    productionType: null,
    status: null,
  }
});

const { queryParams } = toRefs(data);

// 生产类型标签
function productionTypeLabel(type) {
  const map = {
    'readme_analysis': 'README分析',
    'ranking': '排行榜',
    'tutorial': '教程',
    'trending_analysis': '趋势分析'
  };
  return map[type] || type;
}

// 生产类型颜色
function productionTypeColor(type) {
  const map = {
    'readme_analysis': 'info',
    'ranking': 'success',
    'tutorial': 'warning',
    'trending_analysis': 'primary'
  };
  return map[type] || 'info';
}

// 状态标签
function statusLabel(status) {
  const map = {
    '0': '生产中',
    '1': '成功',
    '2': '失败'
  };
  return map[status] || status;
}

// 状态颜色
function statusColor(status) {
  const map = {
    '0': 'info',
    '1': 'success',
    '2': 'danger'
  };
  return map[status] || 'info';
}

/** 查询博客生产记录列表 */
function getList() {
  loading.value = true;
  listBlogProductionRecords(queryParams.value).then(response => {
    blogProductionRecordList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  }).catch(() => {
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

/** 新增按钮操作 */
function handleAdd() {
  proxy.$modal.msgWarning("该功能暂未开放");
}

/** 查看按钮操作 */
function handleView(row) {
  detailData.value = row;
  detailOpen.value = true;
}

/** 删除按钮操作 */
function handleDelete(row) {
  const deleteIds = row.id ? [row.id] : ids.value;
  proxy.$modal.confirm('是否确认删除生产记录编号为"' + deleteIds + '"的数据项？').then(function() {
    return delBlogProductionRecord(deleteIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 修改按钮操作 */
function handleUpdate() {
  proxy.$modal.msgWarning("该功能暂未开放");
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('ai/blogProductionRecord/export', {
    ...queryParams.value
  }, `blogProductionRecord_${new Date().getTime()}.xlsx`);
}

getList();
</script>
