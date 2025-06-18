<template>  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" v-show="showSearch" class="search-form">      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="数据源名称" prop="name">
            <el-input
              v-model="queryParams.name"
              placeholder="请输入数据源名称"
              clearable
              @keyup.enter="handleQuery"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="数据库名称" prop="databaseName">
            <el-input
              v-model="queryParams.databaseName"
              placeholder="请输入数据库名称"
              clearable
              @keyup.enter="handleQuery"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="创建时间" prop="params.beginTime">
            <el-date-picker
              v-model="dateRange"
              value-format="YYYY-MM-DD"
              type="daterange"
              range-separator="-"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 100%"
            ></el-date-picker>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24" style="text-align: right">
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['system:datasource:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['system:datasource:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['system:datasource:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Refresh"
          @click="handleRefresh"
          v-hasPermi="['system:datasource:edit']"
        >刷新</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['system:datasource:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="datasourceList" @selection-change="handleSelectionChange">      <el-table-column type="selection" width="55" align="center" />      <el-table-column label="数据源ID" align="center" prop="dataSourceId" />
      <el-table-column label="数据源名称" align="center" prop="name" :show-overflow-tooltip="true" />
      <el-table-column label="数据库名称" align="center" prop="databaseName" :show-overflow-tooltip="true" />
      <el-table-column label="数据库链接" align="center" prop="url" :show-overflow-tooltip="true" />
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button
            type="text"
            icon="Edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['system:datasource:edit']"
          >修改</el-button>
          <el-button
            type="text"
            icon="Link"
            @click="handleTest(scope.row)"
            v-hasPermi="['system:datasource:query']"
          >测试</el-button>
          <el-button
            type="text"
            icon="Delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['system:datasource:remove']"
          >删除</el-button>
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

    <!-- 添加或修改数据源配置对话框 -->
    <el-dialog :title="title" v-model="open" width="700px" append-to-body>      <el-form ref="datasourceRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="数据源名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入数据源名称" />
        </el-form-item>
        <el-form-item label="数据库名称" prop="databaseName">
          <el-input v-model="form.databaseName" placeholder="请输入数据库名称" />
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入数据库用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入数据库密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="连接URL" prop="url">
          <el-input v-model="form.url" type="textarea" placeholder="请输入数据库连接URL" />
        </el-form-item>
        <el-form-item label="驱动类名" prop="driverClassName">
          <el-input v-model="form.driverClassName" placeholder="请输入驱动类名" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="handleTest(form)">测试连接</el-button>
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, getCurrentInstance } from 'vue';
import { parseTime } from '@/utils/ruoyi';
import {
  listDatasource,
  getDatasource,
  addDatasource,
  updateDatasource,
  delDatasource,
  exportDatasource,
  testDatasource,
  refreshDatasource
} from "@/api/tool/datasource";

const { proxy } = getCurrentInstance();

const ids = ref([]);
const datasourceList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");
const dateRange = ref([]);

// 数据库类型选项
const dbTypeOptions = ref([
  { label: 'MySQL', value: 'MySQL' },
  { label: 'Oracle', value: 'Oracle' },
  { label: 'PostgreSQL', value: 'PostgreSQL' },
  { label: 'SQLServer', value: 'SQLServer' }
]);

// 查询参数
const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  name: undefined,
  databaseName: undefined,
  params: {}
});

const form = ref({
  dataSourceId: undefined,
  name: undefined,
  databaseName: undefined,
  username: undefined,
  password: undefined,
  url: undefined,
  driverClassName: undefined,
  remark: undefined
});

const rules = {
  name: [
    { required: true, message: "数据源名称不能为空", trigger: "blur" },
    { max: 50, message: '数据源名称长度不能超过50个字符', trigger: 'blur' }
  ],
  databaseName: [
    { required: true, message: "数据库名称不能为空", trigger: "blur" },
    { max: 50, message: '数据库名称长度不能超过50个字符', trigger: 'blur' }
  ],
  username: [
    { required: true, message: "用户名不能为空", trigger: "blur" }
  ],
  password: [
    { required: true, message: "密码不能为空", trigger: "blur" }
  ],
  url: [
    { required: true, message: "连接URL不能为空", trigger: "blur" }
  ],
  driverClassName: [
    { required: true, message: "驱动类名不能为空", trigger: "blur" }
  ]
};

/** 查询数据源配置列表 */
function getList() {
  loading.value = true;
  listDatasource(proxy.addDateRange(queryParams.value, dateRange.value)).then(response => {
    datasourceList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

/** 取消按钮 */
function cancel() {
  open.value = false;
  reset();
}

/** 表单重置 */
function reset() {
  form.value = {
    dataSourceId: undefined,
    name: undefined,
    groupName: undefined,
    dbType: undefined,
    username: undefined,
    password: undefined,
    url: undefined,
    driverClassName: undefined,
    remark: undefined
  };
  proxy.resetForm("datasourceRef");
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
  ids.value = selection.map(item => item.dataSourceId);
  single.value = selection.length !== 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加数据源配置";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const dataSourceId = row.dataSourceId || ids.value[0];
  getDatasource(dataSourceId).then(response => {
    form.value = response;
    open.value = true;
    title.value = "修改数据源配置";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["datasourceRef"].validate(valid => {
    if (valid) {
      if (form.value.dataSourceId != undefined) {
        updateDatasource(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addDatasource(form.value).then(response => {
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
  const dataSourceIds = row.dataSourceId || ids.value;
  proxy.$modal.confirm('是否确认删除数据源配置编号为"' + dataSourceIds + '"的数据项？').then(function() {
    return delDatasource(dataSourceIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  });
}

/** 导出按钮操作 */
function handleExport() {
  proxy.$modal.confirm('是否确认导出所有数据源配置数据项？').then(() => {
    proxy.download('system/datasource/export', {
      ...queryParams.value
    }, `datasource_${new Date().getTime()}.xlsx`);
  });
}

/** 测试连接按钮操作 */
function handleTest(row) {
  const testData = row && row.dataSourceId !== undefined ? { dataSourceId: row.dataSourceId } : { ...form.value };
  if (testData.dataSourceId === undefined) {
    if (!testData.password) {
      proxy.$modal.msgError("密码不能为空");
      return;
    }
  }
  testDatasource(testData).then(response => {
    proxy.$modal.msgSuccess("连接测试成功");
  });
}

/** 刷新数据源按钮操作 */
function handleRefresh() {
  proxy.$modal.confirm('是否确认刷新所有数据源？').then(() => {
    return refreshDatasource();
  }).then(() => {
    proxy.$modal.msgSuccess("刷新成功");
  });
}

/** 数据库类型变更时自动填充驱动类名 */
function handleDbTypeChange(value) {
  const driverMap = {
    'MySQL': 'com.mysql.cj.jdbc.Driver',
    'Oracle': 'oracle.jdbc.OracleDriver',
    'PostgreSQL': 'org.postgresql.Driver',
    'SQLServer': 'com.microsoft.sqlserver.jdbc.SQLServerDriver'
  };
  form.value.driverClassName = driverMap[value] || '';
}

getList();
</script>

<style scoped>

</style>
