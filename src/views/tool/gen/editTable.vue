<template>
  <div>
    <el-card>
      <el-tabs v-model="activeName">
        <el-tab-pane label="基本信息" name="basic">
          <basic-info-form ref="basicInfo" :info="info" />
        </el-tab-pane>
        <el-tab-pane label="字段信息" name="columnInfo">
          <!-- 添加工具栏 -->
          <el-row :gutter="20" class="mb8">
            <el-col :span="1.5">
              <el-button type="primary" plain icon="Plus" @click="handleAdd">新增字段</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="danger" plain icon="Delete" :disabled="!selectedColumns.length" @click="handleDelete">
                删除字段
              </el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="success" plain icon="Plus" @click="handleAddDefaultFields">添加默认字段</el-button>
            </el-col>
                      </el-row>
          <el-table ref="dragTable" :data="columns" row-key="columnId" :max-height="tableHeight"
            @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" />
            <el-table-column label="序号" type="index" width="60" />
            <el-table-column label="字段列名" prop="columnName" min-width="150">
              <template #default="scope">
                <el-input v-model="scope.row.columnName" placeholder="请输入字段列名" />
              </template>
            </el-table-column>
            <el-table-column label="字段描述" min-width="150">
              <template #default="scope">
                <el-input v-model="scope.row.columnComment" placeholder="请输入字段描述" />
              </template>
            </el-table-column>
            <el-table-column label="物理类型" prop="columnType" min-width="120">
              <template #default="scope">
                <el-select v-model="scope.row.columnType" style="width: 100%">
                  <el-option label="BIGINT" value="BIGINT" />
                  <el-option label="VARCHAR(255)" value="VARCHAR(255)" />
                  <el-option label="INT" value="INT" />
                  <el-option label="DECIMAL(10,2)" value="DECIMAL(10,2)" />
                  <el-option label="DATETIME" value="DATETIME" />
                  <el-option label="VARCHAR(64)" value="VARCHAR(64)" />
                  <el-option label="VARCHAR(500)" value="VARCHAR(500)" />
                  <el-option label="VARCHAR(50)" value="VARCHAR(50)" />
                  <el-option label="TEXT" value="TEXT" />
                  <el-option label="BLOB" value="BLOB" />
                  <el-option label="TINYINT" value="TINYINT" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="Java类型" min-width="100">
              <template #default="scope">
                <el-select v-model="scope.row.javaType" style="width: 100%">
                  <el-option label="Long" value="Long" />
                  <el-option label="String" value="String" />
                  <el-option label="Integer" value="Integer" />
                  <el-option label="Double" value="Double" />
                  <el-option label="BigDecimal" value="BigDecimal" />
                  <el-option label="Date" value="Date" />
                  <el-option label="Boolean" value="Boolean" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="主键" prop="isPk" width="60" align="center">
              <template #default="scope">
                <el-checkbox v-model="scope.row.isPk" true-value="1" false-value="0" />
              </template>
            </el-table-column>
            <el-table-column label="自增" prop="isIncrement" width="60" align="center">
              <template #default="scope">
                <el-checkbox v-model="scope.row.isIncrement" true-value="1" false-value="0" :disabled="scope.row.isPk !== '1'" />
              </template>
            </el-table-column>
            <el-table-column label="列表" width="60" align="center">
              <template #default="scope">
                <el-checkbox v-model="scope.row.isList" true-value="1" false-value="0" />
              </template>
            </el-table-column>
            <el-table-column label="编辑" width="60" align="center">
              <template #default="scope">
                <el-checkbox v-model="scope.row.isEdit" true-value="1" false-value="0" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" align="center" fixed="right">
              <template #default="scope">
                <el-button type="primary" link size="small" @click="handleEdit(scope.row, scope.$index)">
                  详细配置
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="生成信息" name="genInfo">
          <gen-info-form ref="genInfo" :info="info" :tables="tables" />
        </el-tab-pane>
      </el-tabs>
      <el-form label-width="100px">
        <div style="text-align: center;margin-left:-100px;margin-top:10px;">
          <el-button type="primary" @click="submitForm()">提交</el-button>
          <el-button @click="close()">返回</el-button>
        </div>
      </el-form>
    </el-card>

    <!-- 字段详细配置抽屉 -->
    <el-drawer v-model="drawerVisible" title="字段详细配置" size="600px" direction="rtl">
      <div v-if="currentColumn" class="drawer-content">
        <el-form :model="currentColumn" label-width="120px" label-position="left">
          <!-- 基础信息 -->
          <div class="section-title">
            <el-icon>
              <Document />
            </el-icon>
            <span>基础信息</span>
          </div>
          <el-form-item label="Java属性">
            <el-input v-model="currentColumn.javaField" placeholder="根据字段列名自动生成" disabled />
          </el-form-item>
          <el-form-item label="默认值">
            <el-input v-model="currentColumn.columnDefault" placeholder="请输入字段默认值" />
          </el-form-item>

          <!-- 主键设置 -->
          <div class="section-title">
            <el-icon>
              <Key />
            </el-icon>
            <span>主键设置</span>
          </div>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="主键">
                <el-checkbox v-model="currentColumn.isPk" true-value="1" false-value="0" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="自增">
                <el-checkbox v-model="currentColumn.isIncrement" true-value="1" false-value="0" :disabled="currentColumn.isPk !== '1'" />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 权限控制 -->
          <div class="section-title">
            <el-icon>
              <Lock />
            </el-icon>
            <span>功能权限</span>
          </div>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="插入">
                <el-checkbox v-model="currentColumn.isInsert" true-value="1" false-value="0" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="查询条件">
                <el-checkbox v-model="currentColumn.isQuery" true-value="1" false-value="0" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="必填项">
            <el-checkbox v-model="currentColumn.isRequired" true-value="1" false-value="0" />
          </el-form-item>

          <!-- 查询配置 -->
          <div class="section-title">
            <el-icon>
              <Search />
            </el-icon>
            <span>查询设置</span>
          </div>
          <el-form-item label="查询方式">
            <el-select v-model="currentColumn.queryType" style="width: 100%">
              <el-option label="=" value="EQ" />
              <el-option label="!=" value="NE" />
              <el-option label=">" value="GT" />
              <el-option label=">=" value="GTE" />
              <el-option label="<" value="LT" />
              <el-option label="<=" value="LTE" />
              <el-option label="LIKE" value="LIKE" />
              <el-option label="BETWEEN" value="BETWEEN" />
            </el-select>
          </el-form-item>

          <!-- 显示配置 -->
          <div class="section-title">
            <el-icon>
              <Monitor />
            </el-icon>
            <span>显示设置</span>
          </div>
          <el-form-item label="显示类型">
            <el-select v-model="currentColumn.htmlType" style="width: 100%">
              <el-option label="文本框" value="input" />
              <el-option label="文本域" value="textarea" />
              <el-option label="下拉框" value="select" />
              <el-option label="单选框" value="radio" />
              <el-option label="复选框" value="checkbox" />
              <el-option label="日期控件" value="datetime" />
              <el-option label="图片上传" value="imageUpload" />
              <el-option label="文件上传" value="fileUpload" />
              <el-option label="富文本控件" value="editor" />
            </el-select>
          </el-form-item>

          <!-- 字典配置 -->
          <div class="section-title">
            <el-icon>
              <Collection />
            </el-icon>
            <span>数据字典</span>
          </div>
          <el-form-item label="字典类型">
            <el-select v-model="currentColumn.dictType" clearable filterable placeholder="请选择" style="width: 100%">
              <el-option v-for="dict in dictOptions" :key="dict.dictType" :label="dict.dictName" :value="dict.dictType">
                <span style="float: left">{{ dict.dictName }}</span>
                <span style="float: right; color: #8492a6; font-size: 13px">{{ dict.dictType }}</span>
              </el-option>
            </el-select>
          </el-form-item>

          <!-- 表字典配置 -->
          <template v-if="currentColumn.htmlType === 'select'">
            <div class="section-title">
              <el-icon>
                <DataBoard />
              </el-icon>
              <span>关联表配置</span>
            </div>
            <el-form-item label="表字典名称">
              <el-select v-model="currentColumn.tableDictName" placeholder="请选择" @change="tableDictNameChange"
                style="width: 100%">
                <el-option v-for="(table, index) in tables" :key="index"
                  :label="table.tableName + '：' + table.tableComment" :value="table.tableName"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="显示字段" v-if="currentColumn.tableDictName">
              <el-select v-model="currentColumn.tableDictLabelField" placeholder="请选择" style="width: 100%">
                <el-option v-for="(column, index) in subColumns" :key="index"
                  :label="column.columnName + '：' + column.columnComment" :value="column.columnName"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="值字段" v-if="currentColumn.tableDictName">
              <el-select v-model="currentColumn.tableDictValueField" placeholder="请选择" style="width: 100%">
                <el-option v-for="(column, index) in subColumns" :key="index"
                  :label="column.columnName + '：' + column.columnComment" :value="column.columnName"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="查询条件" v-if="currentColumn.tableDictName">
              <el-input v-model="currentColumn.tableDictCondition" type="textarea" :rows="3"
                placeholder="请输入JSON格式的查询条件，如：{&quot;status&quot;: &quot;1&quot;}" />
            </el-form-item>
          </template>
        </el-form>
      </div>
      <template #footer>
        <div class="drawer-footer">
          <el-button @click="drawerVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveColumn">保存</el-button>
        </div>
      </template>
    </el-drawer>

    </div>
</template>

<script setup name="GenEdit">
import { getGenTable, updateGenTable, updateGenTableColumn } from "@/api/tool/gen";
import { Document, Lock, Search, Monitor, Collection, DataBoard, Key } from '@element-plus/icons-vue';
import { optionselect as getDictOptionselect } from "@/api/system/dict/type";
import basicInfoForm from "./basicInfoForm";
import genInfoForm from "./genInfoForm";

const route = useRoute();
const { proxy } = getCurrentInstance();

const activeName = ref("columnInfo");
const tableHeight = ref(document.documentElement.scrollHeight - 245 + "px");
const tables = ref([]);
const columns = ref([]);
const dictOptions = ref([]);
const info = ref({});
const selectedColumns = ref([]);
let columnIdCounter = ref(1000); // 用于生成新字段的临时ID
const subColumns = ref([]); // 存储选中表的字段信息

// 抽屉相关变量
const drawerVisible = ref(false);
const currentColumn = ref(null);
const currentColumnIndex = ref(-1);


// 计算属性：检查是否有select类型的字段
const hasSelectType = computed(() => {
  return columns.value.some(col => col.htmlType === 'select');
});

/** 提交按钮 */
function submitForm() {
  const basicForm = proxy.$refs.basicInfo.$refs.basicInfoForm;
  const genForm = proxy.$refs.genInfo.$refs.genInfoForm;
  Promise.all([basicForm, genForm].map(getFormPromise)).then(res => {
    const validateResult = res.every(item => !!item);
    if (validateResult) {
      const genTable = Object.assign({}, info.value);
      genTable.columns = columns.value;
      genTable.params = {
        treeCode: info.value.treeCode,
        treeName: info.value.treeName,
        treeParentCode: info.value.treeParentCode,
        parentMenuId: info.value.parentMenuId
      };
      updateGenTable(genTable).then(res => {
        proxy.$modal.msgSuccess(res.msg);
        if (res.code === 200) {
          close();
        }
      });
    } else {
      proxy.$modal.msgError("表单校验未通过，请重新检查提交内容");
    }
  });
}

function getFormPromise(form) {
  return new Promise(resolve => {
    form.validate(res => {
      resolve(res);
    });
  });
}

function close() {
  const obj = { path: "/tool/gen", query: { t: Date.now(), pageNum: route.query.pageNum } };
  proxy.$tab.closeOpenPage(obj);
}

/** 表格多选框选中数据 */
function handleSelectionChange(selection) {
  selectedColumns.value = selection;
}

/** 新增字段 */
function handleAdd() {
  // 获取当前字段中最大的sort值
  let maxSort = 0;
  if (columns.value && columns.value.length > 0) {
    const sortValues = columns.value
      .filter(col => col.sort !== undefined && col.sort !== null && !isNaN(Number(col.sort)))
      .map(col => Number(col.sort));

    if (sortValues.length > 0) {
      maxSort = Math.max(...sortValues);
    }
  }

  const newColumn = {
    columnId: columnIdCounter.value++,
    columnName: '',
    columnComment: '',
    isPk: '0', // 默认非主键
    isIncrement: '0', // 默认非自增
    columnType: 'VARCHAR(50)',
    javaType: 'String',
    javaField: '后台自动生成', // 该字段由后台根据columnName自动生成
    isInsert: '1',
    isEdit: '1',
    isList: '1',
    isQuery: '1',
    queryType: 'EQ',
    isRequired: '0',
    htmlType: 'input',
    dictType: '',
    columnDefault: '', // 添加默认值字段
    // 表字典配置字段
    tableDictName: '',
    tableDictLabelField: '',
    tableDictValueField: '',
    tableDictCondition: '',
    sort: String(maxSort + 1) // 设置为当前最大sort值+1
  };
  columns.value.push(newColumn);
  proxy.$modal.msgSuccess("新增字段成功");
}

/** 删除字段 */
function handleDelete() {
  if (!selectedColumns.value || selectedColumns.value.length === 0) {
    proxy.$modal.msgError("请选择要删除的字段");
    return;
  }

  proxy.$modal.confirm('是否确认删除所选字段？').then(() => {
    const selectedIds = selectedColumns.value
      .filter(row => row && row.columnId !== undefined && row.columnId !== null)
      .map(row => row.columnId);

    if (selectedIds.length === 0) {
      proxy.$modal.msgError("所选字段ID无效");
      return;
    }

    const selectedIdsMap = {};
    selectedIds.forEach(id => {
      if (id !== undefined && id !== null) {
        selectedIdsMap[String(id)] = true;
      }
    });

    columns.value = columns.value.filter(row => {
      if (!row || row.columnId === undefined || row.columnId === null) {
        return true;
      }

      const rowColumnIdStr = String(row.columnId);
      return !selectedIdsMap[rowColumnIdStr];
    });

    selectedColumns.value = [];
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {
    // 用户取消删除操作
  });
}


/** 编辑字段详细配置 */
function handleEdit(row, index) {
  currentColumn.value = { ...row }; // 深拷贝避免直接修改原数据
  currentColumnIndex.value = index;

  // 如果已经选择了表字典名称，自动加载对应的字段选项
  if (currentColumn.value.tableDictName) {
    setTableColumns(currentColumn.value.tableDictName);
  }

  drawerVisible.value = true;
}

/** 保存字段配置 */
function handleSaveColumn() {
  if (currentColumnIndex.value >= 0 && currentColumn.value) {
    // 调用API更新字段配置
    updateGenTableColumn(currentColumn.value).then(res => {
      if (res.code === 200) {
        // 更新本地数据
        columns.value[currentColumnIndex.value] = { ...currentColumn.value };
        drawerVisible.value = false;
        proxy.$modal.msgSuccess("字段配置保存成功");
      } else {
        proxy.$modal.msgError(res.msg || "保存失败");
      }
    }).catch(error => {
      console.error('保存字段配置失败:', error);
      proxy.$modal.msgError("保存字段配置失败: " + (error.message || "网络错误"));
    });
  }
}

/** 添加默认字段 */
function handleAddDefaultFields() {
  const defaultFields = [
    {
      columnName: 'create_by',
      columnComment: '创建者',
      columnType: 'VARCHAR(64)',
      javaType: 'String',
      javaField: 'createBy',
      isInsert: '1',
      isEdit: '0',
      isList: '0',
      isQuery: '0',
      queryType: 'EQ',
      isRequired: '0',
      htmlType: 'input',
      dictType: '',
      columnDefault: ''
    },
    {
      columnName: 'create_time',
      columnComment: '创建时间',
      columnType: 'DATETIME',
      javaType: 'Date',
      javaField: 'createTime',
      isInsert: '1',
      isEdit: '0',
      isList: '0',
      isQuery: '0',
      queryType: 'EQ',
      isRequired: '0',
      htmlType: 'datetime',
      dictType: '',
      columnDefault: ''
    },
    {
      columnName: 'update_by',
      columnComment: '更新者',
      columnType: 'VARCHAR(64)',
      javaType: 'String',
      javaField: 'updateBy',
      isInsert: '0',
      isEdit: '1',
      isList: '0',
      isQuery: '0',
      queryType: 'EQ',
      isRequired: '0',
      htmlType: 'input',
      dictType: '',
      columnDefault: ''
    },
    {
      columnName: 'update_time',
      columnComment: '更新时间',
      columnType: 'DATETIME',
      javaType: 'Date',
      javaField: 'updateTime',
      isInsert: '0',
      isEdit: '1',
      isList: '0',
      isQuery: '0',
      queryType: 'EQ',
      isRequired: '0',
      htmlType: 'datetime',
      dictType: '',
      columnDefault: ''
    },
    {
      columnName: 'del_flag',
      columnComment: '删除标志（0代表存在 1代表删除）',
      columnType: 'VARCHAR(1)',
      javaType: 'String',
      javaField: 'delFlag',
      isInsert: '1',
      isEdit: '0',
      isList: '0',
      isQuery: '0',
      queryType: 'EQ',
      isRequired: '0',
      htmlType: 'input',
      dictType: '',
      columnDefault: '0'
    },
    {
      columnName: 'remark',
      columnComment: '备注',
      columnType: 'VARCHAR(500)',
      javaType: 'String',
      javaField: 'remark',
      isInsert: '1',
      isEdit: '1',
      isList: '0',
      isQuery: '0',
      queryType: 'EQ',
      isRequired: '0',
      htmlType: 'textarea',
      dictType: '',
      columnDefault: ''
    }
  ];

  // 检查字段是否已存在，避免重复添加
  const existingColumnNames = columns.value.map(col => col.columnName);

  // 过滤出不存在的字段
  const fieldsToAdd = defaultFields.filter(field => !existingColumnNames.includes(field.columnName));

  if (fieldsToAdd.length === 0) {
    proxy.$modal.msgInfo("默认字段已全部存在");
    return;
  }

  // 获取当前列表中最大的sort值
  let maxSort = 0;
  if (columns.value && columns.value.length > 0) {
    const sortValues = columns.value
      .filter(col => col.sort !== undefined && col.sort !== null && !isNaN(Number(col.sort)))
      .map(col => Number(col.sort));

    if (sortValues.length > 0) {
      maxSort = Math.max(...sortValues);
    }
  }

  // 为每个字段添加ID和基于最大sort值的递增sort值
  fieldsToAdd.forEach((field, index) => {
    field.isPk = '0';
    field.isIncrement = '0'; // 默认非自增
    field.sort = maxSort + index + 1; // 从当前最大sort值开始递增
  });

  // 添加到列表中
  columns.value = [...columns.value, ...fieldsToAdd];
  proxy.$modal.msgSuccess(`成功添加 ${fieldsToAdd.length} 个默认字段`);
}

/** 表字典名称变化处理 */
function tableDictNameChange(value) {
  if (currentColumn.value) {
    currentColumn.value.tableDictLabelField = "";
    currentColumn.value.tableDictValueField = "";
    setTableColumns(value);
  }
}

/** 设置表字段选项 */
function setTableColumns(tableName) {
  if (!tableName) {
    subColumns.value = [];
    return;
  }

  for (let i = 0; i < tables.value.length; i++) {
    const table = tables.value[i];
    if (tableName === table.tableName) {
      subColumns.value = table.columns || [];
      break;
    }
  }
}

(() => {
  const tableId = route.params && route.params.tableId;
  if (tableId) {
    // 获取表详细信息
    getGenTable(tableId).then(res => {
      columns.value = res.rows;
      info.value = res.info;
      tables.value = res.tables;

      // 设置初始columnId计数器
      if (columns.value.length > 0) {
        const maxId = Math.max(...columns.value.map(col => col.columnId || 0));
        columnIdCounter.value = maxId + 1;
      }
    });
    /** 查询字典下拉列表 */
    getDictOptionselect().then(response => {
      dictOptions.value = response;
    });
  }
})();
</script>

<style scoped>
.mb8 {
  margin-bottom: 8px;
}

.dialog-footer {
  text-align: center;
}


.drawer-content {
  padding: 0 20px;
}

.drawer-footer {
  text-align: right;
  padding: 20px;
  border-top: 1px solid #e4e7ed;
}

/* 自定义分割线样式 */
.section-title {
  display: flex;
  align-items: center;
  margin: 30px 0 20px 0;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-left: 4px solid #409eff;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section-title .el-icon {
  margin-right: 8px;
  font-size: 16px;
  color: #409eff;
}

.section-title span {
  letter-spacing: 0.5px;
}

/* 第一个分割线上边距调整 */
.section-title:first-of-type {
  margin-top: 10px;
}
</style>
