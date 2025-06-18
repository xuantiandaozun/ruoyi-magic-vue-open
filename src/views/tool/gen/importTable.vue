<template>
  <!-- 导入表 -->
  <el-dialog title="导入表" v-model="visible" width="800px" top="5vh" append-to-body>
    <!-- 添加数据源选择下拉框 -->
    <div class="select-datasource" v-if="dataSources.length > 0">
      <el-select v-model="dataSourceName" placeholder="请选择数据源" @change="handleDataSourceChange" style="width: 100%; margin-bottom: 10px;">
        <el-option
          v-for="item in dataSources"
          :key="item.name"
          :label="item.description || item.name"
          :value="item.name">
          <span>{{ item.name }}</span>
          <span style="float: right; color: #8492a6; font-size: 13px">{{ item.databaseName }}</span>
        </el-option>
      </el-select>
      <div class="datasource-info" v-if="currentDataSource">
        <span>当前数据源: {{ currentDataSource.description || currentDataSource.name }}</span>
        <span style="margin-left: 10px;">数据库: {{ currentDataSource.databaseName }}</span>
      </div>
    </div>
    <el-form :model="queryParams" ref="queryRef" :inline="true">
      <el-form-item label="表名称" prop="tableName">
        <el-input
          v-model="queryParams.tableName"
          placeholder="请输入表名称"
          clearable
          style="width: 180px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="表描述" prop="tableComment">
        <el-input
          v-model="queryParams.tableComment"
          placeholder="请输入表描述"
          clearable
          style="width: 180px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>
    <el-row>
      <el-table @row-click="clickRow" ref="table" :data="dbTableList" @selection-change="handleSelectionChange" height="260px">
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="tableName" label="表名称" :show-overflow-tooltip="true"></el-table-column>
        <el-table-column prop="tableComment" label="表描述" :show-overflow-tooltip="true"></el-table-column>
        <el-table-column prop="createTime" label="创建时间"></el-table-column>
        <el-table-column prop="updateTime" label="更新时间"></el-table-column>
      </el-table>
      <pagination
        v-show="total>0"
        :total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </el-row>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="handleImportTable">确 定</el-button>
        <el-button @click="visible = false">取 消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { listDbTable, importTable, listDataSources, listDbTableByDataSource, importTableByDataSource } from "@/api/tool/gen";

const total = ref(0);
const visible = ref(false);
const tables = ref([]);
const dbTableList = ref([]);
const { proxy } = getCurrentInstance();

const dataSources = ref([]);
const dataSourceName = ref("");
const currentDataSource = ref(null);

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  tableName: undefined,
  tableComment: undefined
});

const emit = defineEmits(["ok"]);

/** 查询参数列表 */
function show() {
  getDataSources(); // 获取数据源列表
  getList();
  visible.value = true;
}

/** 单击选择行 */
function clickRow(row) {
  proxy.$refs.table.toggleRowSelection(row);
}

/** 多选框选中数据 */
function handleSelectionChange(selection) {
  tables.value = selection.map(item => item.tableName);
}

/** 查询表数据 */
function getList() {
  if (dataSourceName.value) {
    listDbTableByDataSource(dataSourceName.value, queryParams).then(res => {
      dbTableList.value = res.rows;
      total.value = res.total;
    });
  } else {
    listDbTable(queryParams).then(res => {
      dbTableList.value = res.rows;
      total.value = res.total;
    });
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef");
  handleQuery();
}

/** 导入按钮操作 */
function handleImportTable() {
  const tableNames = tables.value.join(",");
  if (tableNames == "") {
    proxy.$modal.msgError("请选择要导入的表");
    return;
  }
  if (dataSourceName.value) {
    importTableByDataSource(dataSourceName.value, tableNames).then(res => {
      proxy.$modal.msgSuccess(res.msg);
      if (res.code === 200) {
        visible.value = false;
        emit("ok");
      }
    });
  } else {
    importTable({ tables: tableNames }).then(res => {
      proxy.$modal.msgSuccess(res.msg);
      if (res.code === 200) {
        visible.value = false;
        emit("ok");
      }
    });
  }
}

/** 获取数据源列表 */
function getDataSources() {
  listDataSources().then(data => {
    if (data && Array.isArray(data)) {
      dataSources.value = data;
    } else {
      dataSources.value = []; // 确保在API返回空或无效数据时，dataSources为空数组
    }
    // 默认选中 master 数据源（如果存在）
    if (dataSources.value.length > 0) {
      const masterDataSource = dataSources.value.find(item => item.name === 'master');
      if (masterDataSource) {
        dataSourceName.value = masterDataSource.name;
        currentDataSource.value = masterDataSource;
        // getList(); // 切换数据源时会自动调用 getList，此处无需重复调用，除非希望在show()方法中提前加载
      } else if (dataSources.value.length > 0 && !dataSourceName.value) {
        // 如果没有master数据源，但有其他数据源，并且当前没有选中的数据源，可以考虑默认选中第一个
        // dataSourceName.value = dataSources.value[0].name;
        // currentDataSource.value = dataSources.value[0];
      }
    }
  });
}

/** 数据源变更处理 */
function handleDataSourceChange(value) {
  currentDataSource.value = dataSources.value.find(item => item.name === value);
  // 清空表名称和表描述的查询条件，因为不同数据源的表是不同的
  queryParams.tableName = undefined;
  queryParams.tableComment = undefined;
  getList();
}

defineExpose({
  show,
});
</script>
<style scoped>
.select-datasource {
  margin-bottom: 15px;
}
.datasource-info {
  margin-top: 5px;
  font-size: 12px;
  color: #606266;
}
.datasource-info span {
  margin-right: 15px;
}
</style>
