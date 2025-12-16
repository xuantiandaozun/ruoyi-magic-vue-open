<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="auto">
      <el-form-item label="记账类型" prop="recordType">
        <el-select v-model="queryParams.recordType" placeholder="请选择记账类型" clearable>
          <el-option label="支出" value="0" />
          <el-option label="收入" value="1" />
        </el-select>
      </el-form-item>
      <el-form-item label="分类" prop="categoryId">
        <el-select v-model="queryParams.categoryId" placeholder="请选择分类" clearable filterable>
          <el-option
            v-for="category in categoryList"
            :key="category.categoryId"
            :label="category.categoryName"
            :value="category.categoryId"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="账户" prop="accountId">
        <el-select v-model="queryParams.accountId" placeholder="请选择账户" clearable filterable>
          <el-option
            v-for="account in accountList"
            :key="account.accountId"
            :label="account.accountName"
            :value="account.accountId"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="记账日期">
        <el-date-picker
          v-model="dateRange"
          value-format="YYYY-MM-DD"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
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
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['bill:record:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['bill:record:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['bill:record:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['bill:record:export']"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="info"
          plain
          icon="Histogram"
          @click="handleStatistics"
        >统计分析</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="mb8" v-if="statistics.totalIncome !== null">
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center;">
            <div style="color: #67C23A; font-size: 24px; font-weight: bold;">
              ¥{{ statistics.totalIncome }}
            </div>
            <div style="color: #909399; margin-top: 8px;">总收入</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center;">
            <div style="color: #F56C6C; font-size: 24px; font-weight: bold;">
              ¥{{ statistics.totalExpense }}
            </div>
            <div style="color: #909399; margin-top: 8px;">总支出</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center;">
            <div :style="{ color: statistics.balance >= 0 ? '#409EFF' : '#F56C6C', fontSize: '24px', fontWeight: 'bold' }">
              ¥{{ statistics.balance }}
            </div>
            <div style="color: #909399; margin-top: 8px;">结余</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center;">
            <div style="color: #409EFF; font-size: 24px; font-weight: bold;">
              {{ statistics.totalCount }}
            </div>
            <div style="color: #909399; margin-top: 8px;">笔数</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-table v-loading="loading" :data="recordList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="类型" align="center" prop="recordType" min-width="80">
        <template #default="scope">
          <el-tag v-if="scope.row.recordType === '0'" type="danger">支出</el-tag>
          <el-tag v-else type="success">收入</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="金额" align="center" prop="amount" min-width="120">
        <template #default="scope">
          <span :style="{ color: scope.row.recordType === '0' ? '#F56C6C' : '#67C23A', fontWeight: 'bold' }">
            {{ scope.row.recordType === '0' ? '-' : '+' }}¥{{ scope.row.amount }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="分类" align="center" prop="categoryName" min-width="100" />
      <el-table-column label="账户" align="center" prop="accountName" min-width="100" />
      <el-table-column label="记账日期" align="center" prop="recordDate" min-width="110" />
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip />
      <el-table-column label="记账人" align="center" prop="userName" min-width="100" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" min-width="180">
        <template #default="scope">
          <el-button
            link
            type="primary"
            icon="Edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['bill:record:edit']"
          >修改</el-button>
          <el-button
            link
            type="danger"
            icon="Delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['bill:record:remove']"
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

    <!-- 添加或修改账单记录对话框 -->
    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="recordRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="记账类型" prop="recordType">
          <el-radio-group v-model="form.recordType" @change="handleTypeChange">
            <el-radio label="0">支出</el-radio>
            <el-radio label="1">收入</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number v-model="form.amount" :precision="2" :step="0.01" :min="0.01" placeholder="请输入金额" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="请选择分类" style="width: 100%;" filterable>
            <el-option
              v-for="category in filteredCategories"
              :key="category.categoryId"
              :label="category.categoryName"
              :value="category.categoryId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="账户" prop="accountId">
          <el-select v-model="form.accountId" placeholder="请选择账户" style="width: 100%;" filterable>
            <el-option
              v-for="account in accountList"
              :key="account.accountId"
              :label="account.accountName"
              :value="account.accountId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="记账日期" prop="recordDate">
          <el-date-picker
            v-model="form.recordDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择记账日期"
            style="width: 100%;"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
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

<script setup name="BillRecord">
import { listAccount } from "@/api/bill/account";
import { listCategory } from "@/api/bill/category";
import { addRecord, delRecord, getRecord, getUserStatistics, listRecord, updateRecord } from "@/api/bill/record";

const { proxy } = getCurrentInstance();

const recordList = ref([]);
const categoryList = ref([]);
const accountList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");
const dateRange = ref([]);

const statistics = ref({
  totalIncome: null,
  totalExpense: null,
  balance: null,
  totalCount: null
});

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    recordType: null,
    categoryId: null,
    accountId: null,
    startDate: null,
    endDate: null
  },
  rules: {
    recordType: [
      { required: true, message: "记账类型不能为空", trigger: "change" }
    ],
    amount: [
      { required: true, message: "金额不能为空", trigger: "blur" }
    ],
    categoryId: [
      { required: true, message: "分类不能为空", trigger: "change" }
    ],
    recordDate: [
      { required: true, message: "记账日期不能为空", trigger: "blur" }
    ]
  }
});

const { queryParams, form, rules } = toRefs(data);

// 根据记账类型过滤分类
const filteredCategories = computed(() => {
  if (!form.value.recordType) return categoryList.value;
  return categoryList.value.filter(item => item.categoryType === form.value.recordType);
});

/** 查询账单记录列表 */
function getList() {
  loading.value = true;
  if (dateRange.value && dateRange.value.length === 2) {
    queryParams.value.startDate = dateRange.value[0];
    queryParams.value.endDate = dateRange.value[1];
  } else {
    queryParams.value.startDate = null;
    queryParams.value.endDate = null;
  }
  listRecord(queryParams.value).then(response => {
    recordList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

/** 获取统计数据 */
function getStatistics() {
  const params = {
    startDate: dateRange.value && dateRange.value[0] || null,
    endDate: dateRange.value && dateRange.value[1] || null
  };
  getUserStatistics(params).then(response => {
    statistics.value = response;
  });
}

/** 获取分类列表 */
function getCategoryList() {
  listCategory({ pageNum: 1, pageSize: 1000 }).then(response => {
    categoryList.value = response.rows;
  });
}

/** 获取账户列表 */
function getAccountList() {
  listAccount({ pageNum: 1, pageSize: 1000 }).then(response => {
    accountList.value = response.rows;
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
    recordId: null,
    recordType: "0",
    amount: null,
    categoryId: null,
    accountId: null,
    recordDate: null,
    remark: null
  };
  proxy.resetForm("recordRef");
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
  getStatistics();
}

/** 重置按钮操作 */
function resetQuery() {
  dateRange.value = [];
  proxy.resetForm("queryRef");
  handleQuery();
}

// 多选框选中数据
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.recordId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加账单记录";
  form.value.recordDate = proxy.parseTime(new Date(), '{y}-{m}-{d}');
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const recordId = row.recordId || ids.value[0];
  getRecord(recordId).then(response => {
    form.value = response;
    open.value = true;
    title.value = "修改账单记录";
  });
}

/** 记账类型改变 */
function handleTypeChange() {
  form.value.categoryId = null;
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["recordRef"].validate(valid => {
    if (valid) {
      if (form.value.recordId != null) {
        updateRecord(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
          getStatistics();
        });
      } else {
        addRecord(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功");
          open.value = false;
          getList();
          getStatistics();
        });
      }
    }
  });
}

/** 删除按钮操作 */
function handleDelete(row) {
  const recordIds = row.recordId || ids.value;
  proxy.$modal.confirm('是否确认删除账单记录编号为"' + recordIds + '"的数据项？').then(function() {
    return delRecord(recordIds);
  }).then(() => {
    getList();
    getStatistics();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('bill/record/export', {
    ...queryParams.value
  }, `bill_record_${new Date().getTime()}.xlsx`)
}

/** 统计分析 */
function handleStatistics() {
  proxy.$router.push({ path: '/bill/statistics' });
}

onMounted(() => {
  getList();
  getStatistics();
  getCategoryList();
  getAccountList();
});
</script>

<style scoped>
.mb8 {
  margin-bottom: 8px;
}
</style>
