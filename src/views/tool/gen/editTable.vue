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
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Magic" @click="handleAiOptimize">AI优化字段</el-button>
          </el-col>
        </el-row>
        <el-table ref="dragTable" :data="columns" row-key="columnId" :max-height="tableHeight"
          @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" />
          <el-table-column label="序号" type="index" min-width="5%" /> <el-table-column label="字段列名" prop="columnName"
            min-width="10%">
            <template #default="scope">
              <el-input v-model="scope.row.columnName" placeholder="请输入字段列名" />
            </template>
          </el-table-column>
          <el-table-column label="主键" prop="isPk" min-width="5%">
            <template #default="scope">
              <el-checkbox v-model="scope.row.isPk" true-value="1" false-value="0" />
            </template>
          </el-table-column>
          <el-table-column label="字段描述" min-width="10%">
            <template #default="scope">
              <el-input v-model="scope.row.columnComment" placeholder="请输入字段描述"></el-input>
            </template>
          </el-table-column>
          <el-table-column label="物理类型" prop="columnType" min-width="10%">
            <template #default="scope">
              <el-select v-model="scope.row.columnType">
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
          <el-table-column label="Java类型" min-width="11%">
            <template #default="scope">
              <el-select v-model="scope.row.javaType">
                <el-option label="Long" value="Long" />
                <el-option label="String" value="String" />
                <el-option label="Integer" value="Integer" />
                <el-option label="Double" value="Double" />
                <el-option label="BigDecimal" value="BigDecimal" />
                <el-option label="Date" value="Date" />
                <el-option label="Boolean" value="Boolean" />
              </el-select>
            </template>
          </el-table-column> <el-table-column label="java属性" min-width="10%">
            <template #default="scope">
              <el-input v-model="scope.row.javaField" placeholder="根据字段列名自动生成" disabled></el-input>
            </template>
          </el-table-column>

          <el-table-column label="插入" min-width="5%">
            <template #default="scope">
              <el-checkbox true-value="1" false-value="0" v-model="scope.row.isInsert"></el-checkbox>
            </template>
          </el-table-column>
          <el-table-column label="编辑" min-width="5%">
            <template #default="scope">
              <el-checkbox true-value="1" false-value="0" v-model="scope.row.isEdit"></el-checkbox>
            </template>
          </el-table-column>
          <el-table-column label="列表" min-width="5%">
            <template #default="scope">
              <el-checkbox true-value="1" false-value="0" v-model="scope.row.isList"></el-checkbox>
            </template>
          </el-table-column>
          <el-table-column label="查询" min-width="5%">
            <template #default="scope">
              <el-checkbox true-value="1" false-value="0" v-model="scope.row.isQuery"></el-checkbox>
            </template>
          </el-table-column>
          <el-table-column label="查询方式" min-width="10%">
            <template #default="scope">
              <el-select v-model="scope.row.queryType">
                <el-option label="=" value="EQ" />
                <el-option label="!=" value="NE" />
                <el-option label=">" value="GT" />
                <el-option label=">=" value="GTE" />
                <el-option label="<" value="LT" />
                <el-option label="<=" value="LTE" />
                <el-option label="LIKE" value="LIKE" />
                <el-option label="BETWEEN" value="BETWEEN" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="必填" min-width="5%">
            <template #default="scope">
              <el-checkbox true-value="1" false-value="0" v-model="scope.row.isRequired"></el-checkbox>
            </template>
          </el-table-column>
          <el-table-column label="显示类型" min-width="12%">
            <template #default="scope">
              <el-select v-model="scope.row.htmlType">
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
            </template>
          </el-table-column>
          <el-table-column label="字典类型" min-width="12%">
            <template #default="scope">
              <el-select v-model="scope.row.dictType" clearable filterable placeholder="请选择">
                <el-option v-for="dict in dictOptions" :key="dict.dictType" :label="dict.dictName"
                  :value="dict.dictType">
                  <span style="float: left">{{ dict.dictName }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">{{ dict.dictType }}</span>
                </el-option>
              </el-select>
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

  <!-- AI优化字段状态弹窗 -->
  <el-dialog title="AI优化字段" v-model="statusVisible" width="500px" top="20vh" append-to-body
    :close-on-click-modal="false" :close-on-press-escape="false">
    <div class="status-container">
      <div class="status-icon">
        <el-icon v-if="taskStatus === 'PENDING'" class="loading-icon" size="48" color="#409EFF">
          <Clock />
        </el-icon>
        <el-icon v-else-if="taskStatus === 'RUNNING'" class="loading-icon rotating" size="48" color="#409EFF">
          <Loading />
        </el-icon>
        <el-icon v-else-if="taskStatus === 'SUCCESS'" size="48" color="#67C23A">
          <SuccessFilled />
        </el-icon>
        <el-icon v-else-if="taskStatus === 'FAILED'" size="48" color="#F56C6C">
          <CircleCloseFilled />
        </el-icon>
      </div>
      <div class="status-text">
        <h3 v-if="taskStatus === 'PENDING'">等待中...</h3>
        <h3 v-else-if="taskStatus === 'RUNNING'">AI优化中...</h3>
        <h3 v-else-if="taskStatus === 'SUCCESS'">优化成功！</h3>
        <h3 v-else-if="taskStatus === 'FAILED'">优化失败</h3>
        <p v-if="taskStatus === 'PENDING'" class="status-desc">任务已提交，正在等待处理</p>
        <p v-else-if="taskStatus === 'RUNNING'" class="status-desc">
          <span v-if="extraInfo && extraInfo.currentAction">
            <template v-if="extraInfo.currentAction === '创建表定义'">
              正在{{ extraInfo.currentAction }}：{{ extraInfo.tableName }} ({{ extraInfo.tableComment }})
            </template>
            <template v-else-if="extraInfo.currentAction === '创建表结构'">
              正在{{ extraInfo.currentAction }}：{{ extraInfo.tableName }}，共{{ extraInfo.fieldCount }}个字段
            </template>
            <template v-else-if="extraInfo.currentAction === '同步表到数据库'">
              正在{{ extraInfo.currentAction }}：{{ extraInfo.tableName }}
            </template>
            <template v-else-if="extraInfo.currentAction === '优化字段'">
              正在{{ extraInfo.currentAction }}：{{ extraInfo.columnName }}
            </template>
            <template v-else>
              {{ extraInfo.currentAction }}
            </template>
          </span>
          <span v-else>AI正在分析并优化字段，请稍候...</span>
        </p>
        <p v-else-if="taskStatus === 'SUCCESS'" class="status-desc">字段已成功优化</p>
        <p v-else-if="taskStatus === 'FAILED'" class="status-desc">{{ errorMessage || '优化过程中出现错误，请重试' }}</p>
      </div>
    </div>
    <template #footer v-if="taskStatus === 'FAILED' || taskStatus === 'SUCCESS'">
      <div class="dialog-footer">
        <el-button type="primary" @click="closeStatusDialog">确 定</el-button>
      </div>
    </template>
  </el-dialog>
  </div>
</template>

<script setup name="GenEdit">
import { getGenTable, updateGenTable, aiOptimizeColumns, aiOptimizeColumnsAsync, getAsyncTaskStatus } from "@/api/tool/gen";
import { Clock, Loading, SuccessFilled, CircleCloseFilled } from '@element-plus/icons-vue';
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

// AI优化字段异步任务相关变量
const statusVisible = ref(false);
const taskStatus = ref('');
const taskId = ref('');
const errorMessage = ref('');
const pollTimer = ref(null);
const extraInfo = ref(null);

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

/** AI优化字段设置 */
function handleAiOptimize() {
  const tableId = route.params && route.params.tableId;
  if (!tableId) {
    proxy.$modal.msgError("表ID不能为空");
    return;
  }

  proxy.$modal.confirm('确认要使用AI优化当前表的字段设置吗？').then(() => {
    aiOptimizeColumnsAsync(tableId).then(data => {
      // 获取任务ID
      taskId.value = data;
      // 显示状态弹窗
      showStatusDialog();
      // 开始轮询
      startPolling();
    }).catch(err => {
      proxy.$modal.msgError("提交AI优化任务失败: " + err.message);
    });
  });
}

/** 显示状态弹窗 */
function showStatusDialog() {
  statusVisible.value = true;
  taskStatus.value = 'PENDING';
  errorMessage.value = '';
  extraInfo.value = null;
}

/** 关闭状态弹窗 */
function closeStatusDialog() {
  statusVisible.value = false;
  stopPolling();
  taskStatus.value = '';
  taskId.value = '';
  errorMessage.value = '';
  extraInfo.value = null;
}

/** 开始轮询任务状态 */
function startPolling() {
  if (pollTimer.value) {
    clearInterval(pollTimer.value);
  }

  pollTimer.value = setInterval(() => {
    checkTaskStatus();
  }, 2000); // 每2秒轮询一次
}

/** 停止轮询 */
function stopPolling() {
  if (pollTimer.value) {
    clearInterval(pollTimer.value);
    pollTimer.value = null;
  }
}

/** 检查任务状态 */
function checkTaskStatus() {
  if (!taskId.value) return;

  getAsyncTaskStatus(taskId.value).then(res => {
    if (res.code === 200) {
      const data = res.data;
      const status = data.status;
      taskStatus.value = status;

      // 解析extraInfo
      if (data.extraInfo) {
        try {
          extraInfo.value = JSON.parse(data.extraInfo);
        } catch (e) {
          console.error('解析extraInfo失败:', e);
          extraInfo.value = null;
        }
      }

      if (status === 'SUCCESS') {
        stopPolling();
        // 延迟1秒后关闭弹窗并刷新数据
        setTimeout(() => {
          closeStatusDialog();
          proxy.$modal.msgSuccess('AI优化字段成功！');
          // 刷新表格数据
          const tableId = route.params && route.params.tableId;
          getGenTable(tableId).then(res => {
            columns.value = res.rows;
            info.value = res.info;
            tables.value = res.tables;
          });
        }, 1000);
      } else if (status === 'FAILED') {
        stopPolling();
        errorMessage.value = data.errorMessage || '任务执行失败';
      }
      // PENDING 和 RUNNING 状态继续轮询
    } else {
      proxy.$modal.msgError(res.msg || "获取任务状态失败");
    }
  }).catch(error => {
    stopPolling();
    taskStatus.value = 'FAILED';
    errorMessage.value = '查询任务状态失败：' + error.message;
  });
}

// 组件销毁时清理定时器
onBeforeUnmount(() => {
  stopPolling();
});

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
      dictType: ''
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
      dictType: ''
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
      dictType: ''
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
      dictType: ''
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
      dictType: ''
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
      dictType: ''
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
    field.sort = maxSort + index + 1; // 从当前最大sort值开始递增
  });

  // 添加到列表中
  columns.value = [...columns.value, ...fieldsToAdd];
  proxy.$modal.msgSuccess(`成功添加 ${fieldsToAdd.length} 个默认字段`);
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

.status-container {
  text-align: center;
  padding: 20px 0;
}

.status-icon {
  margin-bottom: 20px;
}

.loading-icon {
  display: inline-block;
}

.rotating {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.status-text h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
  font-weight: 500;
}

.status-text .status-desc {
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}
</style>
