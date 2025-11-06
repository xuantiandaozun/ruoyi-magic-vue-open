<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="封面类型" prop="coverType">
        <el-select v-model="queryParams.coverType" placeholder="请选择封面类型" clearable style="width: 200px">
          <el-option label="通用封面" value="0" />
          <el-option label="个性化封面" value="1" />
        </el-select>
      </el-form-item>
      <el-form-item label="博客分类" prop="category">
        <el-input
          v-model="queryParams.category"
          placeholder="请输入博客分类"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="生成状态" prop="generationStatus">
        <el-select v-model="queryParams.generationStatus" placeholder="请选择生成状态" clearable style="width: 200px">
          <el-option label="生成中" value="0" />
          <el-option label="成功" value="1" />
          <el-option label="失败" value="2" />
          <el-option label="仅生成提示词" value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="使用状态" prop="isUsed">
        <el-select v-model="queryParams.isUsed" placeholder="请选择使用状态" clearable style="width: 200px">
          <el-option label="已使用" value="1" />
          <el-option label="未使用" value="0" />
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
          v-hasPermi="['ai:coverGenerationRecord:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['ai:coverGenerationRecord:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['ai:coverGenerationRecord:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['ai:coverGenerationRecord:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="coverGenerationRecordList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="博客名称" align="center" prop="blogName" />
      <el-table-column label="封面类型" align="center" prop="coverType">
        <template #default="scope">
          <el-tag :type="coverTypeColor(scope.row.coverType)">
            {{ coverTypeLabel(scope.row.coverType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="博客分类" align="center" prop="category" />
      <el-table-column label="提示词" align="left" prop="prompt" show-overflow-tooltip />
      <el-table-column label="生成状态" align="center" prop="generationStatus">
        <template #default="scope">
          <el-tag :type="generationStatusColor(scope.row.generationStatus)">
            {{ generationStatusLabel(scope.row.generationStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="使用状态" align="center" prop="isUsed">
        <template #default="scope">
          <el-tag :type="scope.row.isUsed === '1' ? 'success' : 'info'">
            {{ scope.row.isUsed === '1' ? '已使用' : '未使用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="AI模型" align="center" prop="aiModel" />
      <el-table-column label="生成时间" align="center" prop="generationTime">
        <template #default="scope">
          <span>{{ parseTime(scope.row.generationTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="280">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleView(scope.row)" v-hasPermi="['ai:coverGenerationRecord:query']">查看</el-button>
          <el-button link type="success" icon="Picture" @click="handleViewImage(scope.row)" v-if="scope.row.imageUrl" v-hasPermi="['ai:coverGenerationRecord:query']">预览图片</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['ai:coverGenerationRecord:remove']">删除</el-button>
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
    <el-dialog :title="'生图记录详情'" v-model="detailOpen" width="800px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="博客名称">{{ detailData.blogName }}</el-descriptions-item>
        <el-descriptions-item label="封面类型">
          <el-tag :type="coverTypeColor(detailData.coverType)">
            {{ coverTypeLabel(detailData.coverType) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="博客分类">{{ detailData.category }}</el-descriptions-item>
        <el-descriptions-item label="生成状态">
          <el-tag :type="generationStatusColor(detailData.generationStatus)">
            {{ generationStatusLabel(detailData.generationStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="使用状态">
          <el-tag :type="detailData.isUsed === '1' ? 'success' : 'info'">
            {{ detailData.isUsed === '1' ? '已使用' : '未使用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="AI模型">{{ detailData.aiModel }}</el-descriptions-item>
        <el-descriptions-item label="相似度得分">{{ detailData.similarityScore }}</el-descriptions-item>
        <el-descriptions-item label="生成时间">{{ parseTime(detailData.generationTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ parseTime(detailData.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</el-descriptions-item>
        <el-descriptions-item label="生图提示词" :span="2">
          <el-text class="prompt-text">{{ detailData.prompt }}</el-text>
        </el-descriptions-item>
        <el-descriptions-item label="错误信息" :span="2">
          <el-text v-if="detailData.errorMessage" type="danger">{{ detailData.errorMessage }}</el-text>
          <el-text v-else type="success">无</el-text>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 图片预览对话框 -->
    <el-dialog 
      :title="'封面图片预览'" 
      v-model="imageOpen" 
      width="50%" 
      :modal-append-to-body="true" 
      destroy-on-close
      class="image-preview-dialog"
    >
      <div class="image-preview-container">
        <el-image
          :src="imageUrl"
          fit="contain"
          :preview-src-list="[imageUrl]"
          :initial-index="0"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup name="CoverGenerationRecord">
import { delCoverGenerationRecord, listCoverGenerationRecords } from "@/api/ai/coverGenerationRecord";
import { parseTime } from "@/utils/ruoyi";
import { getCurrentInstance, reactive, ref, toRefs } from "vue";

const { proxy } = getCurrentInstance();

const coverGenerationRecordList = ref([]);
const detailOpen = ref(false);
const detailData = ref({});
const imageOpen = ref(false);
const imageUrl = ref("");
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
    coverType: null,
    category: null,
    generationStatus: null,
    isUsed: null,
  }
});

const { queryParams } = toRefs(data);

// 封面类型标签
function coverTypeLabel(type) {
  const map = {
    '0': '通用封面',
    '1': '个性化封面'
  };
  return map[type] || type;
}

// 封面类型颜色
function coverTypeColor(type) {
  const map = {
    '0': 'info',
    '1': 'success'
  };
  return map[type] || 'info';
}

// 生成状态标签
function generationStatusLabel(status) {
  const map = {
    '0': '生成中',
    '1': '成功',
    '2': '失败',
    '3': '仅生成提示词'
  };
  return map[status] || status;
}

// 生成状态颜色
function generationStatusColor(status) {
  const map = {
    '0': 'info',
    '1': 'success',
    '2': 'danger',
    '3': 'warning'
  };
  return map[status] || 'info';
}

/** 查询生图记录列表 */
function getList() {
  loading.value = true;
  listCoverGenerationRecords(queryParams.value).then(response => {
    coverGenerationRecordList.value = response.rows;
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

/** 预览图片 */
function handleViewImage(row) {
  imageUrl.value = row.imageUrl;
  imageOpen.value = true;
}

/** 删除按钮操作 */
function handleDelete(row) {
  const deleteIds = row.id ? [row.id] : ids.value;
  proxy.$modal.confirm('是否确认删除生成记录编号为"' + deleteIds + '"的数据项？').then(function() {
    return delCoverGenerationRecord(deleteIds);
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
  proxy.download('ai/coverGenerationRecord/export', {
    ...queryParams.value
  }, `coverGenerationRecord_${new Date().getTime()}.xlsx`);
}

getList();
</script>

<style scoped>
.image-preview-dialog :deep(.el-dialog) {
  margin: 5vh auto;
  max-width: 60%;
}

.image-preview-dialog :deep(.el-dialog__header) {
  padding: 12px 15px 8px;
}

.image-preview-dialog :deep(.el-dialog__body) {
  padding: 5px 10px;
}

.image-preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 70vh;
  padding: 0;
}

.image-preview-container :deep(.el-image) {
  width: 100%;
  height: 100%;
  max-width: 100%;
}

.prompt-text {
  word-break: break-all;
  white-space: pre-wrap;
}
</style>
