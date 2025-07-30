<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="表名称" prop="tableName">
        <el-input
          v-model="queryParams.tableName"
          placeholder="请输入表名称"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="表描述" prop="tableComment">
        <el-input
          v-model="queryParams.tableComment"
          placeholder="请输入表描述"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <!-- 在这里可以根据需要添加数据源相关的筛选条件 -->
      <!-- 例如：
      <el-form-item label="数据源" prop="dataSourceName">
        <el-select v-model="queryParams.dataSourceName" placeholder="请选择数据源" clearable style="width: 200px">
          <el-option v-for="item in dataSourceOptions" :key="item.name" :label="item.description || item.name" :value="item.name" />
        </el-select>
      </el-form-item>
      -->
      <el-form-item label="创建时间" style="width: 308px">
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
          icon="Download"
          :disabled="multiple"
          @click="handleBatchGenTable"
          v-hasPermi="['tool:gen:code']"
        >批量生成</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="openCreateTable"
          v-hasRole="['admin']"
        >创建</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="info"
          plain
          icon="Upload"
          @click="openImportTable"
          v-hasPermi="['tool:gen:import']"
        >导入</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Refresh"
          @click="openSyncFromDb"
          v-hasPermi="['tool:gen:import']"
        >从数据库同步</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleEditTable"
          v-hasPermi="['tool:gen:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="EditPen"
          :disabled="multiple"
          @click="handleBatchEdit"
          v-hasPermi="['tool:gen:edit']"
        >批量修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['tool:gen:remove']"
        >删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="tableList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" align="center" width="55"></el-table-column>
      <el-table-column label="序号" type="index" width="50" align="center">
        <template #default="scope">
          <span>{{(queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1}}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="表名称"
        align="center"
        prop="tableName"
        :show-overflow-tooltip="true"
      />
      <el-table-column
        label="表描述"
        align="center"
        prop="tableComment"
        :show-overflow-tooltip="true"
      />
      <el-table-column
        label="实体"
        align="center"
        prop="className"
        :show-overflow-tooltip="true"
      />
      <!-- 根据需要，可以在表格中增加数据源列 -->
      <el-table-column
        label="数据源"
        align="center"
        prop="dataSource"
        :show-overflow-tooltip="true"
      />
     
      <el-table-column label="创建时间" align="center" prop="createTime" width="160" />
      <el-table-column label="更新时间" align="center" prop="updateTime" width="160" />
      <el-table-column label="操作" align="center" width="450" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handlePreview(scope.row)" v-hasPermi="['tool:gen:preview']">
            预览
          </el-button>
          <el-button link type="primary" icon="Edit" @click="handleEditTable(scope.row)" v-hasPermi="['tool:gen:edit']">
            编辑
          </el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['tool:gen:remove']">
            删除
          </el-button>
          <el-button link type="primary" icon="Refresh" @click="handleSynchDb(scope.row)" v-hasPermi="['tool:gen:edit']">
            同步到数据库
          </el-button>
          <el-button link type="primary" icon="Upload" @click="handleSyncFromDbTable(scope.row)" v-hasPermi="['tool:gen:import']">
            从数据库同步
          </el-button>
          <el-button link type="primary" icon="Download" @click="handleBatchGenTable(scope.row)" v-hasPermi="['tool:gen:code']">
            生成代码
          </el-button>
          <el-button link type="primary" icon="Key" @click="handleExecPermissionSql(scope.row)" v-hasPermi="['tool:gen:edit']">
            执行权限SQL
          </el-button>
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
    <!-- 预览界面 -->
    <el-dialog :title="preview.title" v-model="preview.open" width="80%" top="5vh" append-to-body class="scrollbar">
      <el-tabs v-model="preview.activeName">
        <el-tab-pane
          v-for="(value, key) in preview.data"
          :label="key.substring(key.lastIndexOf('/')+1,key.indexOf('.vm'))"
          :name="key.substring(key.lastIndexOf('/')+1,key.indexOf('.vm'))"
          :key="value"
        >
          <el-link :underline="false" icon="DocumentCopy" v-copyText="value" v-copyText:callback="copyTextSuccess" style="float:right">&nbsp;复制</el-link>
          <pre>{{ value }}</pre>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
    <import-table ref="importRef" @ok="handleQuery" />
    <create-table ref="createRef" @ok="handleQuery" />
    
    <!-- 批量生成代码选择对话框 -->
    <el-dialog title="批量生成代码" v-model="genDialog.open" width="500px" append-to-body>
      <el-form ref="genFormRef" :model="genDialog.form" label-width="120px">
        <el-form-item label="生成类型" prop="genType">
          <el-radio-group v-model="genDialog.form.genType">
            <el-radio label="all">全部</el-radio>
            <el-radio label="java">Java代码</el-radio>
            <el-radio label="vue">Vue代码</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="生成方式" prop="genMode">
          <el-radio-group v-model="genDialog.form.genMode">
            <el-radio label="download">下载代码</el-radio>
            <el-radio label="path">生成到自定义路径</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitGenForm">确 定</el-button>
          <el-button @click="cancelGenForm">取 消</el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 批量修改对话框 -->
    <el-dialog title="批量修改代码生成配置" v-model="batchEdit.open" width="800px" append-to-body>
      <el-form ref="batchEditRef" :model="batchEdit.form" :rules="batchEdit.rules" label-width="120px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="生成模板" prop="tplCategory">
              <el-select v-model="batchEdit.form.tplCategory" placeholder="请选择生成模板" clearable>
                <el-option label="单表（增删改查）" value="crud" />
                <el-option label="树表（增删改查）" value="tree" />
                <el-option label="主子表（增删改查）" value="sub" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="前端类型" prop="tplWebType">
              <el-select v-model="batchEdit.form.tplWebType" placeholder="请选择前端类型" clearable>
                <el-option label="Vue2 Element UI 模版" value="element-ui" />
                <el-option label="Vue3 Element Plus 模版" value="element-plus" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="生成包路径" prop="packageName">
              <el-input v-model="batchEdit.form.packageName" placeholder="请输入生成包路径" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生成模块名" prop="moduleName">
              <el-input v-model="batchEdit.form.moduleName" placeholder="请输入生成模块名" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="生成功能作者" prop="functionAuthor">
              <el-input v-model="batchEdit.form.functionAuthor" placeholder="请输入生成功能作者" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生成代码方式" prop="genType">
              <el-select v-model="batchEdit.form.genType" placeholder="请选择生成代码方式" clearable>
                <el-option label="zip压缩包" value="0" />
                <el-option label="自定义路径" value="1" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-if="batchEdit.form.genType === '1'">
          <el-col :span="24">
            <el-form-item label="Java代码路径" prop="genPath">
              <el-input v-model="batchEdit.form.genPath" placeholder="请选择Java代码生成路径" clearable>
                <template #append>
                  <el-button @click="selectBatchJavaPath">
                    <el-icon>
                      <Folder />
                    </el-icon>
                  </el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-if="batchEdit.form.genType === '1'">
          <el-col :span="24">
            <el-form-item label="Vue代码路径" prop="vuePath">
              <el-input v-model="batchEdit.form.vuePath" placeholder="请选择Vue代码生成路径" clearable>
                <template #append>
                  <el-button @click="selectBatchVuePath">
                    <el-icon>
                      <Folder />
                    </el-icon>
                  </el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="数据源名称" prop="dataSource">
              <el-select v-model="batchEdit.form.dataSource" placeholder="请选择数据源" clearable>
                <el-option v-for="item in dataSourceOptions" :key="item.name" :label="item.description || item.name" :value="item.name" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item>
              <template #label>
                上级菜单
                <el-tooltip content="分配到指定菜单下，例如 系统管理" placement="top">
                  <el-icon><question-filled /></el-icon>
                </el-tooltip>
              </template>
              <el-tree-select v-model="batchEdit.form.parentMenuId" :data="menuOptions"
                :props="{ value: 'menuId', label: 'menuName', children: 'children' }" value-key="menuId"
                placeholder="请选择系统菜单" check-strictly />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-alert
              title="说明：只有填写的字段才会被批量修改，空字段将保持原值不变。生成业务名和生成功能名不支持批量修改。"
              type="info"
              :closable="false"
              show-icon>
            </el-alert>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitBatchEdit">确 定</el-button>
          <el-button @click="cancelBatchEdit">取 消</el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- Java路径选择器 -->
    <DirectorySelector v-model="showBatchJavaPathSelector" title="选择Java代码生成路径" @confirm="handleBatchJavaPathConfirm" />

    <!-- Vue路径选择器 -->
    <DirectorySelector v-model="showBatchVuePathSelector" title="选择Vue代码生成路径" @confirm="handleBatchVuePathConfirm" />
    
    <!-- 从数据库同步对话框 -->
    <el-dialog title="从数据库同步" v-model="syncFromDbDialog.open" width="500px" append-to-body>
      <el-form ref="syncFromDbRef" :model="syncFromDbDialog.form" :rules="syncFromDbDialog.rules" label-width="120px">
        <el-form-item label="表名" prop="tableName">
          <el-input v-model="syncFromDbDialog.form.tableName" placeholder="请输入要同步的表名" clearable />
        </el-form-item>
        <el-form-item label="数据源" prop="dataSourceName">
          <el-select v-model="syncFromDbDialog.form.dataSourceName" placeholder="请选择数据源" clearable>
            <el-option label="主数据源(master)" value="master" />
            <el-option v-for="item in dataSourceOptions" :key="item.name" :label="item.description || item.name" :value="item.name" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitSyncFromDb">确 定</el-button>
          <el-button @click="cancelSyncFromDb">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Gen">
import { ref, reactive, toRefs, getCurrentInstance, onActivated } from 'vue';
import { useRoute } from 'vue-router';
import { listTable, previewTable, delTable, genCode, synchDb, listDataSources, execPermissionSql, batchUpdateGenTable, batchGenCode, batchDownload, getGenTable, syncTableFromDb } from "@/api/tool/gen"; // 引入 listDataSources
import { listMenu } from "@/api/system/menu";
import router from "@/router";
import importTable from "./importTable";
import createTable from "./createTable";
import DirectorySelector from "@/components/DirectorySelector/index.vue";
import { Folder, QuestionFilled } from '@element-plus/icons-vue';

const route = useRoute();
const { proxy } = getCurrentInstance();

const tableList = ref([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const tableNames = ref([]);
const dateRange = ref([]);
const uniqueId = ref("");

const dataSourceOptions = ref([]); // 用于存储数据源选项
const menuOptions = ref([]); // 用于存储菜单选项

// 目录选择器相关状态
const showBatchJavaPathSelector = ref(false);
const showBatchVuePathSelector = ref(false);

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    tableName: undefined,
    tableComment: undefined,
    // dataSourceName: undefined, // 如果需要在列表页筛选数据源，取消此行注释
  },
  preview: {
    open: false,
    title: "代码预览",
    data: {},
    activeName: "domain.java"
  },
  genDialog: {
    open: false,
    form: {
      genType: 'all',
      genMode: 'download',
      tableIds: []
    },
    currentRow: null
  },
  batchEdit: {
    open: false,
    form: {
      tplCategory: '',
      tplWebType: '',
      packageName: '',
      moduleName: '',
      functionAuthor: '',
      genType: '',
      genPath: '',
      vuePath: '',
      dataSource: '',
      parentMenuId: undefined
    },
    rules: {
      // 批量修改时所有字段都是可选的，不需要必填验证
    }
  },
  syncFromDbDialog: {
    open: false,
    form: {
      tableName: '',
      dataSourceName: 'master'
    },
    rules: {
      tableName: [
        { required: true, message: '表名不能为空', trigger: 'blur' },
        { pattern: /^[a-zA-Z0-9_]+$/, message: '表名只能包含字母、数字和下划线', trigger: 'blur' }
      ]
    }
  }
});

const { queryParams, preview, genDialog, batchEdit, syncFromDbDialog } = toRefs(data);

onActivated(() => {
  const time = route.query.t;
  if (time != null && time != uniqueId.value) {
    uniqueId.value = time;
    queryParams.value.pageNum = Number(route.query.pageNum);
    dateRange.value = [];
    proxy.resetForm("queryForm");
    getList();
  }
})

/** 查询表集合 */
function getList() {
  loading.value = true;
  // 在调用 listTable 时，可以根据 queryParams.dataSourceName 来传递数据源信息，如果后端支持的话
  listTable(proxy.addDateRange(queryParams.value, dateRange.value)).then(response => {
    tableList.value = response.rows;
    total.value = Number(response.total);
    loading.value = false;
  });
}

/** 获取数据源列表 */
function getDataSourcesForFilter() {
  listDataSources().then(data => {
    dataSourceOptions.value = data;
  });
}

/** 查询菜单下拉树结构 */
function getMenuTreeselect() {
  listMenu().then(data => {
    menuOptions.value = proxy.handleTree(data, "menuId");
  });
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 批量生成代码操作 */
function handleBatchGenTable(row) {
  // 重置表单
  genDialog.value.form.genType = 'all';
  genDialog.value.form.genMode = 'download';
  
  if (row) {
    // 单行操作
    genDialog.value.form.tableIds = [row.tableId];
    genDialog.value.currentRow = row;
  } else {
    // 批量操作
    if (ids.value.length === 0) {
      proxy.$modal.msgError("请选择要生成的数据");
      return;
    }
    genDialog.value.form.tableIds = ids.value;
    genDialog.value.currentRow = null;
  }
  
  // 打开弹窗
  genDialog.value.open = true;
}

/** 取消生成代码 */
function cancelGenForm() {
  genDialog.value.open = false;
}

/** 提交生成代码表单 */
function submitGenForm() {
  const loading = proxy.$loading({
    lock: true,
    text: '正在生成代码，请稍候...',
    background: 'rgba(0, 0, 0, 0.7)',
  });
  
  const data = {
    tableIds: genDialog.value.form.tableIds,
    genType: genDialog.value.form.genType
  };
  
  try {
    if (genDialog.value.form.genMode === 'download') {
      // 下载代码
      batchDownload(data).then(response => {
        loading.close();
        proxy.$download.saveAs(response, 'ruoyi-code.zip');
        genDialog.value.open = false;
        proxy.$modal.msgSuccess("代码生成成功");
      }).catch(() => {
        loading.close();
      });
    } else {
      // 生成到自定义路径
      batchGenCode(data).then(response => {
        loading.close();
        genDialog.value.open = false;
        proxy.$modal.msgSuccess("代码生成成功");
      }).catch(() => {
        loading.close();
      });
    }
  } catch (error) {
    loading.close();
    console.error("生成代码出错:", error);
  }
}

/** 同步数据库操作 */
function handleSynchDb(row) {
  const tableName = row.tableName;
  proxy.$modal.confirm('确认要强制同步"' + tableName + '"表结构吗？').then(function () {
    return synchDb(tableName);
  }).then(() => {
    proxy.$modal.msgSuccess("同步成功");
  }).catch(() => {});
}

/** 从数据库同步表操作 */
function handleSyncFromDbTable(row) {
  const tableName = row.tableName;
  const dataSourceName = row.dataSource || 'master';
  
  proxy.$modal.confirm('确认要从数据库同步"' + tableName + '"表结构吗？').then(function () {
    const data = {
      tableName: tableName,
      dataSourceName: dataSourceName
    };
    return syncTableFromDb(data);
  }).then((response) => {
    proxy.$modal.msgSuccess( "同步成功");
    getList(); // 刷新列表
  }).catch(() => {});
}

/** 打开导入表弹窗 */
function openImportTable() {
  proxy.$refs["importRef"].show();
}

/** 打开创建表弹窗 */
function openCreateTable() {
  proxy.$refs["createRef"].show();
}

/** 重置按钮操作 */
function resetQuery() {
  dateRange.value = [];
  proxy.resetForm("queryRef");
  handleQuery();
}

/** 预览按钮 */
function handlePreview(row) {
  previewTable(row.tableId).then(response => {
    preview.value.data = response;
    preview.value.open = true;
    preview.value.activeName = "domain.java";
  });
}

/** 复制代码成功 */
function copyTextSuccess() {
  proxy.$modal.msgSuccess("复制成功");
}

// 多选框选中数据
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.tableId);
  tableNames.value = selection.map(item => item.tableName);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 修改按钮操作 */
function handleEditTable(row) {
  const tableId = row.tableId || ids.value[0];
  router.push({ path: "/tool/gen-edit/index/" + tableId, query: { pageNum: queryParams.value.pageNum } });
}

/** 删除按钮操作 */
function handleDelete(row) {
  const tableIds = row.tableId || ids.value;
  proxy.$modal.confirm('是否确认删除表编号为"' + tableIds + '"的数据项？').then(function () {
    return delTable(tableIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 执行权限SQL操作 */
function handleExecPermissionSql(row) {
  const tableId = row.tableId;
  proxy.$modal.confirm('确认要执行"' + row.tableName + '"表的权限SQL吗？').then(function() {
    return execPermissionSql(tableId);
  }).then(() => {
    proxy.$modal.msgSuccess("执行成功");
  }).catch(() => {});
}

/** 批量修改按钮操作 */
function handleBatchEdit() {
  if (ids.value.length === 0) {
    proxy.$modal.msgError("请选择要批量修改的数据");
    return;
  }
  resetBatchEditForm();
  
  // 获取选中的第一条数据作为默认值
  const firstSelectedId = ids.value[0];
  const firstSelectedTable = tableList.value.find(table => table.tableId === firstSelectedId);
  
  if (firstSelectedTable) {
    // 调用接口获取详细信息
    getGenTable(firstSelectedId).then(response => {
      // 填充默认值
      batchEdit.value.form.tplCategory = response.info.tplCategory || '';
      batchEdit.value.form.tplWebType = response.info.tplWebType || '';
      batchEdit.value.form.packageName = response.info.packageName || '';
      batchEdit.value.form.moduleName = response.info.moduleName || '';
      batchEdit.value.form.functionAuthor = response.info.functionAuthor || '';
      batchEdit.value.form.genType = response.info.genType || '';
      batchEdit.value.form.genPath = response.info.genPath || '';
      batchEdit.value.form.vuePath = response.info.vuePath || '';
      batchEdit.value.form.dataSource = response.dataSource || '';
      batchEdit.value.form.parentMenuId = response.info.parentMenuId;
    });
  }
  
  batchEdit.value.open = true;
}

/** 重置批量修改表单 */
function resetBatchEditForm() {
  batchEdit.value.form = {
    tplCategory: '',
    tplWebType: '',
    packageName: '',
    moduleName: '',
    functionAuthor: '',
    genType: '',
    genPath: '',
    vuePath: '',
    dataSource: '',
    parentMenuId: undefined
  };
}

/** 选择批量修改Java代码路径 */
function selectBatchJavaPath() {
  showBatchJavaPathSelector.value = true;
}

/** 选择批量修改Vue代码路径 */
function selectBatchVuePath() {
  showBatchVuePathSelector.value = true;
}

/** 确认选择批量修改Java路径 */
function handleBatchJavaPathConfirm(path) {
  batchEdit.value.form.genPath = path;
  showBatchJavaPathSelector.value = false;
}

/** 确认选择批量修改Vue路径 */
function handleBatchVuePathConfirm(path) {
  batchEdit.value.form.vuePath = path;
  showBatchVuePathSelector.value = false;
}

/** 取消批量修改 */
function cancelBatchEdit() {
  batchEdit.value.open = false;
  resetBatchEditForm();
}

/** 提交批量修改 */
function submitBatchEdit() {
  // 构建要修改的表数据
  const tables = [];
  const selectedTables = tableList.value.filter(table => ids.value.includes(table.tableId));
  
  selectedTables.forEach(table => {
    const updateData = {
      tableId: table.tableId
    };
    
    // 只添加非空字段
    if (batchEdit.value.form.tplCategory) {
      updateData.tplCategory = batchEdit.value.form.tplCategory;
    }
    if (batchEdit.value.form.tplWebType) {
      updateData.tplWebType = batchEdit.value.form.tplWebType;
    }
    if (batchEdit.value.form.packageName) {
      updateData.packageName = batchEdit.value.form.packageName;
    }
    if (batchEdit.value.form.moduleName) {
      updateData.moduleName = batchEdit.value.form.moduleName;
    }
    if (batchEdit.value.form.functionAuthor) {
      updateData.functionAuthor = batchEdit.value.form.functionAuthor;
    }
    if (batchEdit.value.form.genType) {
      updateData.genType = batchEdit.value.form.genType;
    }
    if (batchEdit.value.form.genPath) {
      updateData.genPath = batchEdit.value.form.genPath;
    }
    if (batchEdit.value.form.vuePath) {
      updateData.vuePath = batchEdit.value.form.vuePath;
    }
    if (batchEdit.value.form.dataSource) {
      updateData.dataSource = batchEdit.value.form.dataSource;
    }
    if (batchEdit.value.form.parentMenuId) {
      updateData.parentMenuId = batchEdit.value.form.parentMenuId;
    }
    
    tables.push(updateData);
  });
  
  // 检查是否有要修改的字段
  const hasChanges = tables.some(table => Object.keys(table).length > 1); // tableId不算
  if (!hasChanges) {
    proxy.$modal.msgError("请至少填写一个要修改的字段");
    return;
  }
  
  const requestData = {
    tables: tables
  };
  
  batchUpdateGenTable(requestData).then(() => {
    proxy.$modal.msgSuccess("批量修改成功");
    batchEdit.value.open = false;
    resetBatchEditForm();
    getList();
  }).catch(() => {
    proxy.$modal.msgError("批量修改失败");
  });
}

/** 打开从数据库同步对话框 */
function openSyncFromDb() {
  syncFromDbDialog.value.form.tableName = '';
  syncFromDbDialog.value.form.dataSourceName = 'master';
  syncFromDbDialog.value.open = true;
}

/** 取消从数据库同步 */
function cancelSyncFromDb() {
  syncFromDbDialog.value.open = false;
  proxy.resetForm("syncFromDbRef");
}

/** 提交从数据库同步 */
function submitSyncFromDb() {
  proxy.$refs["syncFromDbRef"].validate(valid => {
    if (valid) {
      const data = {
        tableName: syncFromDbDialog.value.form.tableName,
        dataSourceName: syncFromDbDialog.value.form.dataSourceName
      };
      
      syncTableFromDb(data).then(response => {
        proxy.$modal.msgSuccess(response.msg || "同步成功");
        syncFromDbDialog.value.open = false;
        proxy.resetForm("syncFromDbRef");
        getList(); // 刷新列表
      }).catch(error => {
        console.error("同步失败:", error);
      });
    }
  });
}

getList();
getDataSourcesForFilter(); // 如果需要在列表页筛选数据源，取消此行注释
getMenuTreeselect(); // 获取菜单树数据
</script>
