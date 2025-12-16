<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="auto">
      <el-form-item label="提醒类型" prop="reminderType">
        <el-select v-model="queryParams.reminderType" placeholder="请选择提醒类型" clearable>
          <el-option label="记账提醒" value="0" />
          <el-option label="账单提醒" value="1" />
          <el-option label="预算提醒" value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="启用状态" prop="enabled">
        <el-select v-model="queryParams.enabled" placeholder="请选择启用状态" clearable>
          <el-option label="已启用" value="1" />
          <el-option label="已禁用" value="0" />
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
          v-hasPermi="['bill:reminder:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="CircleCheck"
          :disabled="multiple"
          @click="handleBatchEnable"
          v-hasPermi="['bill:reminder:edit']"
        >批量启用</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="CircleClose"
          :disabled="multiple"
          @click="handleBatchDisable"
          v-hasPermi="['bill:reminder:edit']"
        >批量禁用</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleBatchDelete"
          v-hasPermi="['bill:reminder:remove']"
        >批量删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="reminderList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="提醒名称" align="center" prop="reminderName" show-overflow-tooltip />
      <el-table-column label="提醒类型" align="center" prop="reminderType" min-width="110">
        <template #default="scope">
          <el-tag v-if="scope.row.reminderType === '0'" type="primary">记账提醒</el-tag>
          <el-tag v-else-if="scope.row.reminderType === '1'" type="success">账单提醒</el-tag>
          <el-tag v-else type="warning">预算提醒</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="提醒时间" align="center" prop="reminderTime" min-width="100" />
      <el-table-column label="提醒日期" align="center" prop="reminderDay" min-width="100">
        <template #default="scope">
          <span v-if="scope.row.reminderDay">{{ scope.row.reminderDay }}号</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="重复类型" align="center" prop="repeatType" min-width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.repeatType === '0'" size="small">每天</el-tag>
          <el-tag v-else-if="scope.row.repeatType === '1'" type="success" size="small">每周</el-tag>
          <el-tag v-else-if="scope.row.repeatType === '2'" type="warning" size="small">每月</el-tag>
          <el-tag v-else type="info" size="small">自定义</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="启用状态" align="center" prop="enabled" min-width="100">
        <template #default="scope">
          <el-switch
            v-model="scope.row.enabled"
            active-value="1"
            inactive-value="0"
            @change="handleToggle(scope.row)"
            v-hasPermi="['bill:reminder:edit']"
          ></el-switch>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" min-width="180">
        <template #default="scope">
          <el-button
            link
            type="primary"
            icon="Edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['bill:reminder:edit']"
          >修改</el-button>
          <el-button
            link
            type="danger"
            icon="Delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['bill:reminder:remove']"
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

    <!-- 添加或修改提醒对话框 -->
    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="reminderRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="提醒名称" prop="reminderName">
          <el-input v-model="form.reminderName" placeholder="请输入提醒名称" />
        </el-form-item>
        <el-form-item label="提醒类型" prop="reminderType">
          <el-radio-group v-model="form.reminderType">
            <el-radio label="0">记账提醒</el-radio>
            <el-radio label="1">账单提醒</el-radio>
            <el-radio label="2">预算提醒</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="提醒时间" prop="reminderTime">
          <el-time-picker
            v-model="form.reminderTime"
            value-format="HH:mm:ss"
            placeholder="选择提醒时间"
            style="width: 100%;"
          ></el-time-picker>
        </el-form-item>
        <el-form-item label="提醒日期" prop="reminderDay" v-if="form.reminderType === '1'">
          <el-input-number v-model="form.reminderDay" :min="1" :max="31" placeholder="每月几号" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="重复类型" prop="repeatType">
          <el-radio-group v-model="form.repeatType">
            <el-radio label="0">每天</el-radio>
            <el-radio label="1">每周</el-radio>
            <el-radio label="2">每月</el-radio>
            <el-radio label="3">自定义</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="启用状态" prop="enabled">
          <el-radio-group v-model="form.enabled">
            <el-radio label="1">启用</el-radio>
            <el-radio label="0">禁用</el-radio>
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

<script setup name="BillReminder">
import { addReminder, batchDelReminders, batchDisableReminders, batchEnableReminders, delReminder, getReminder, listReminder, toggleReminder, updateReminder } from "@/api/bill/reminder";

const { proxy } = getCurrentInstance();

const reminderList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const multiple = ref(true);
const total = ref(0);
const title = ref("");

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    reminderType: null,
    enabled: null
  },
  rules: {
    reminderName: [
      { required: true, message: "提醒名称不能为空", trigger: "blur" }
    ],
    reminderType: [
      { required: true, message: "提醒类型不能为空", trigger: "change" }
    ],
    reminderTime: [
      { required: true, message: "提醒时间不能为空", trigger: "blur" }
    ]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询提醒列表 */
function getList() {
  loading.value = true;
  listReminder(queryParams.value).then(response => {
    reminderList.value = response.rows;
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
    reminderId: null,
    reminderName: null,
    reminderType: "0",
    reminderTime: null,
    reminderDay: null,
    repeatType: "0",
    enabled: "1"
  };
  proxy.resetForm("reminderRef");
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
  ids.value = selection.map(item => item.reminderId);
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加提醒";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  getReminder(row.reminderId).then(response => {
    form.value = response;
    open.value = true;
    title.value = "修改提醒";
  });
}

/** 启用/禁用开关 */
function handleToggle(row) {
  const text = row.enabled === "1" ? "启用" : "禁用";
  toggleReminder(row.reminderId, row.enabled === "1").then(() => {
    proxy.$modal.msgSuccess(text + "成功");
  }).catch(() => {
    row.enabled = row.enabled === "1" ? "0" : "1";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["reminderRef"].validate(valid => {
    if (valid) {
      if (form.value.reminderId != null) {
        updateReminder(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addReminder(form.value).then(response => {
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
  proxy.$modal.confirm('是否确认删除提醒"' + row.reminderName + '"？').then(function() {
    return delReminder(row.reminderId);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 批量启用 */
function handleBatchEnable() {
  batchEnableReminders(ids.value).then(() => {
    getList();
    proxy.$modal.msgSuccess("批量启用成功");
  });
}

/** 批量禁用 */
function handleBatchDisable() {
  batchDisableReminders(ids.value).then(() => {
    getList();
    proxy.$modal.msgSuccess("批量禁用成功");
  });
}

/** 批量删除 */
function handleBatchDelete() {
  proxy.$modal.confirm('是否确认批量删除选中的提醒？').then(function() {
    return batchDelReminders(ids.value);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("批量删除成功");
  }).catch(() => {});
}

onMounted(() => {
  getList();
});
</script>
