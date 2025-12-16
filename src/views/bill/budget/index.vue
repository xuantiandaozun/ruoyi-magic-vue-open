<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="auto">
      <el-form-item label="预算类型" prop="budgetType">
        <el-select v-model="queryParams.budgetType" placeholder="请选择预算类型" clearable>
          <el-option label="月度" value="0" />
          <el-option label="年度" value="1" />
        </el-select>
      </el-form-item>
      <el-form-item label="年份" prop="budgetYear">
        <el-date-picker
          v-model="queryParams.budgetYear"
          type="year"
          value-format="YYYY"
          placeholder="选择年份"
        ></el-date-picker>
      </el-form-item>
      <el-form-item label="月份" prop="budgetMonth" v-if="queryParams.budgetType === '0'">
        <el-select v-model="queryParams.budgetMonth" placeholder="请选择月份" clearable>
          <el-option v-for="i in 12" :key="i" :label="i + '月'" :value="i" />
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
          v-hasPermi="['bill:budget:add']"
        >新增</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="budgetList">
      <el-table-column label="预算类型" align="center" prop="budgetType" min-width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.budgetType === '0'" type="primary">月度</el-tag>
          <el-tag v-else type="success">年度</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="预算时间" align="center" min-width="130">
        <template #default="scope">
          <span v-if="scope.row.budgetType === '0'">
            {{ scope.row.budgetYear }}年{{ scope.row.budgetMonth }}月
          </span>
          <span v-else>{{ scope.row.budgetYear }}年</span>
        </template>
      </el-table-column>
      <el-table-column label="分类" align="center" prop="categoryName" min-width="100">
        <template #default="scope">
          <span>{{ scope.row.categoryName || '总预算' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="预算金额" align="center" prop="budgetAmount" min-width="110">
        <template #default="scope">
          <span style="font-weight: bold; color: #409EFF;">¥{{ scope.row.budgetAmount }}</span>
        </template>
      </el-table-column>
      <el-table-column label="实际支出" align="center" prop="actualAmount" min-width="110">
        <template #default="scope">
          <span style="font-weight: bold; color: #F56C6C;">¥{{ scope.row.actualAmount }}</span>
        </template>
      </el-table-column>
      <el-table-column label="进度" align="center" min-width="180">
        <template #default="scope">
          <el-progress 
            :percentage="calculatePercentage(scope.row)" 
            :color="getProgressColor(scope.row)"
            :status="getProgressStatus(scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" min-width="90">
        <template #default="scope">
          <el-tag v-if="scope.row.status === '0'" type="info">正常</el-tag>
          <el-tag v-else-if="scope.row.status === '1'" type="success">已完成</el-tag>
          <el-tag v-else type="danger">已超支</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" min-width="200">
        <template #default="scope">
          <el-button
            link
            type="success"
            icon="RefreshRight"
            @click="handleRefresh(scope.row)"
            v-hasPermi="['bill:budget:edit']"
          >刷新</el-button>
          <el-button
            link
            type="primary"
            icon="Edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['bill:budget:edit']"
          >修改</el-button>
          <el-button
            link
            type="danger"
            icon="Delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['bill:budget:remove']"
          >删除</el-button>
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

    <!-- 添加或修改预算对话框 -->
    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="budgetRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="预算类型" prop="budgetType">
          <el-radio-group v-model="form.budgetType">
            <el-radio label="0">月度</el-radio>
            <el-radio label="1">年度</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="年份" prop="budgetYear">
          <el-date-picker
            v-model="form.budgetYear"
            type="year"
            value-format="YYYY"
            placeholder="选择年份"
            style="width: 100%;"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="月份" prop="budgetMonth" v-if="form.budgetType === '0'">
          <el-select v-model="form.budgetMonth" placeholder="请选择月份" style="width: 100%;">
            <el-option v-for="i in 12" :key="i" :label="i + '月'" :value="i" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="请选择分类(不选为总预算)" clearable style="width: 100%;" filterable>
            <el-option
              v-for="category in expenseCategories"
              :key="category.categoryId"
              :label="category.categoryName"
              :value="category.categoryId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="预算金额" prop="budgetAmount">
          <el-input-number v-model="form.budgetAmount" :precision="2" :step="100" :min="0.01" placeholder="请输入预算金额" style="width: 100%;" />
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

<script setup name="BillBudget">
import { addBudget, delBudget, getBudget, listBudget, refreshActualAmount, updateBudget } from "@/api/bill/budget";
import { listCategory } from "@/api/bill/category";

const { proxy } = getCurrentInstance();

const budgetList = ref([]);
const expenseCategories = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const title = ref("");

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    budgetType: null,
    budgetYear: null,
    budgetMonth: null
  },
  rules: {
    budgetType: [
      { required: true, message: "预算类型不能为空", trigger: "change" }
    ],
    budgetYear: [
      { required: true, message: "年份不能为空", trigger: "blur" }
    ],
    budgetAmount: [
      { required: true, message: "预算金额不能为空", trigger: "blur" }
    ]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 计算预算进度百分比 */
function calculatePercentage(row) {
  if (!row.budgetAmount) return 0;
  const percent = (row.actualAmount / row.budgetAmount) * 100;
  return Math.min(percent, 100);
}

/** 获取进度条颜色 */
function getProgressColor(row) {
  const percent = calculatePercentage(row);
  if (percent >= 100) return '#F56C6C';
  if (percent >= 80) return '#E6A23C';
  return '#67C23A';
}

/** 获取进度条状态 */
function getProgressStatus(row) {
  const percent = calculatePercentage(row);
  if (percent >= 100) return 'exception';
  return null;
}

/** 查询预算列表 */
function getList() {
  loading.value = true;
  listBudget(queryParams.value).then(response => {
    budgetList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

/** 获取支出分类列表 */
function getCategoryList() {
  listCategory({ categoryType: '0', pageNum: 1, pageSize: 1000 }).then(response => {
    expenseCategories.value = response.rows;
  });
}

// 取消按钮
function cancel() {
  open.value = false;
  reset();
}

// 表单重置
function reset() {
  const currentYear = new Date().getFullYear().toString();
  const currentMonth = new Date().getMonth() + 1;
  form.value = {
    budgetId: null,
    budgetType: "0",
    categoryId: null,
    budgetAmount: null,
    budgetYear: currentYear,
    budgetMonth: currentMonth
  };
  proxy.resetForm("budgetRef");
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

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加预算";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  getBudget(row.budgetId).then(response => {
    form.value = response;
    open.value = true;
    title.value = "修改预算";
  });
}

/** 刷新实际金额 */
function handleRefresh(row) {
  proxy.$modal.confirm('是否刷新预算"' + (row.categoryName || '总预算') + '"的实际支出金额？').then(function() {
    return refreshActualAmount(row.budgetId);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("刷新成功");
  }).catch(() => {});
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["budgetRef"].validate(valid => {
    if (valid) {
      if (form.value.budgetId != null) {
        updateBudget(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addBudget(form.value).then(response => {
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
  proxy.$modal.confirm('是否确认删除该预算？').then(function() {
    return delBudget(row.budgetId);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

onMounted(() => {
  getList();
  getCategoryList();
});
</script>
