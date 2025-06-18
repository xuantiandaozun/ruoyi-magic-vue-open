<template>
  <el-card>
    <el-tabs v-model="activeName">
      <el-tab-pane label="基本信息" name="basic">
        <basic-info-form ref="basicInfo" :info="info" />
      </el-tab-pane>
      <el-tab-pane label="字段信息" name="columnInfo">
        <!-- 添加工具栏 -->
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="primary" plain icon="Plus" @click="handleAdd">新增字段</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="!selectedColumns.length" @click="handleDelete">
              删除字段
            </el-button>
          </el-col>
        </el-row>
        <el-table 
          ref="dragTable" 
          :data="columns" 
          row-key="columnId" 
          :max-height="tableHeight"
          @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" />
          <el-table-column label="序号" type="index" min-width="5%"/>          <el-table-column
            label="字段列名"
            prop="columnName"
            min-width="10%"
          >
            <template #default="scope">
              <el-input v-model="scope.row.columnName" placeholder="请输入字段列名" />
            </template>
          </el-table-column>
          <el-table-column
            label="主键"
            prop="isPk"
            min-width="5%"
          >
            <template #default="scope">
              <el-checkbox v-model="scope.row.isPk" true-label="1" false-value="0" />
            </template>
          </el-table-column>
          <el-table-column
            label="字段描述"
            prop="columnComment"
            min-width="10%"
          >
            <template #default="scope">
              <el-input v-model="scope.row.columnComment" placeholder="请输入字段描述" />
            </template>
          </el-table-column>          <el-table-column
            label="物理类型"
            prop="columnType"
            min-width="10%"
          >
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
          <el-table-column
            label="Java类型"
            prop="javaType"
            min-width="10%"
          >
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
          </el-table-column>
          <el-table-column
            label="java属性"
            prop="javaField"
            min-width="10%"
          >
            <template #default="scope">
              <el-input v-model="scope.row.javaField" placeholder="请输入java属性" />
            </template>
          </el-table-column>
          <el-table-column
            label="插入"
            prop="isInsert"
            min-width="5%"
          >
            <template #default="scope">
              <el-checkbox v-model="scope.row.isInsert" true-label="1" false-value="0" />
            </template>
          </el-table-column>
          <el-table-column
            label="编辑"
            prop="isEdit"
            min-width="5%"
          >
            <template #default="scope">
              <el-checkbox v-model="scope.row.isEdit" true-label="1" false-value="0" />
            </template>
          </el-table-column>
          <el-table-column
            label="列表"
            prop="isList"
            min-width="5%"
          >
            <template #default="scope">
              <el-checkbox v-model="scope.row.isList" true-label="1" false-value="0" />
            </template>
          </el-table-column>
          <el-table-column
            label="查询"
            prop="isQuery"
            min-width="5%"
          >
            <template #default="scope">
              <el-checkbox v-model="scope.row.isQuery" true-label="1" false-value="0" />
            </template>
          </el-table-column>
          <el-table-column
            label="查询方式"
            prop="queryType"
            min-width="10%"
          >
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
          <el-table-column
            label="必填"
            prop="isRequired"
            min-width="5%"
          >
            <template #default="scope">
              <el-checkbox v-model="scope.row.isRequired" true-label="1" false-value="0" />
            </template>
          </el-table-column>
          <el-table-column
            label="显示类型"
            prop="htmlType"
            min-width="10%"
          >            <template #default="scope">
              <el-select v-model="scope.row.htmlType">
                <el-option label="文本框" value="input" />
                <el-option label="文本域" value="textarea" />
                <el-option label="下拉框" value="select" />
                <el-option label="单选框" value="radio" />
                <el-option label="复选框" value="checkbox" />
                <el-option label="日期控件" value="datetime" />
                <el-option label="上传控件" value="upload" />
                <el-option label="富文本" value="editor" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column
            label="字典类型"
            prop="dictType"
            min-width="10%"
          >
            <template #default="scope">
              <el-input v-model="scope.row.dictType" placeholder="请输入字典类型" />
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
    <el-form label-width="100px">
      <div style="text-align: center;margin-left:-100px;margin-top:10px;">
        <el-button type="primary" @click="submitForm()">确认创建</el-button>
        <el-button @click="close()">返回</el-button>
      </div>
    </el-form>
  </el-card>
</template>

<script setup name="PreviewTable">
import { createImportTable } from "@/api/tool/gen";
import basicInfoForm from "./basicInfoForm";

const route = useRoute();
const { proxy } = getCurrentInstance();

const activeName = ref("columnInfo");
const tableHeight = ref(document.documentElement.scrollHeight - 245 + "px");
const columns = ref([]);
const info = ref({});
const selectedColumns = ref([]);
let columnIdCounter = ref(1000); // 用于生成新字段的临时ID

/** 确认创建按钮 */
function submitForm() {
  const basicForm = proxy.$refs.basicInfo.$refs.basicInfoForm;
  basicForm.validate(valid => {
    if (valid) {
      // 构造导入表的数据
      // 处理数据，确保提交正确的格式
      const rowsToSubmit = columns.value.map(col => {
        // 如果有原始htmlType值，则恢复它
        if (col.originalHtmlType) {
          return {
            ...col,
            htmlType: col.originalHtmlType
          };
        }
        // 否则尝试将英文转换为中文（如果需要）
        if (htmlTypeReverseMap[col.htmlType]) {
          return {
            ...col,
            htmlType: htmlTypeReverseMap[col.htmlType]
          };
        }
        return col;
      });
      
      const importData = {
        tables: info.value.tableName,
        info: info.value,
        rows: rowsToSubmit
      };
      
      createImportTable(importData).then(res => {
        close();
      });
    }
  });
}

/** 关闭页面 */
function close() {
  const obj = { path: "/tool/gen", query: { t: Date.now() }};
  proxy.$tab.closeOpenPage(obj);
}

/** 表格多选框选中数据 */
function handleSelectionChange(selection) {
  selectedColumns.value = selection;
}

/** 新增字段 */
function handleAdd() {
  const newColumn = {
    columnId: columnIdCounter.value++,
    columnName: '',
    columnComment: '',
    isPk: '0', // 默认非主键
    columnType: 'varchar(50)',
    javaType: 'String',
    javaField: '',
    isInsert: '1',
    isEdit: '1',
    isList: '1',
    isQuery: '1',
    queryType: 'EQ',
    isRequired: '0',
    htmlType: 'input', // 使用英文格式
    dictType: ''
  };
  columns.value.push(newColumn);
  proxy.$modal.msgSuccess("新增字段成功");
}

function handleDelete() {
  if (!selectedColumns.value || selectedColumns.value.length === 0) {
    console.log('未选择任何字段，无法删除');
    proxy.$modal.msgError("请选择要删除的字段");
    return;
  }
  
  proxy.$modal.confirm('是否确认删除所选字段？').then(() => {
    const selectedIds = selectedColumns.value
      .filter(row => row && row.columnId !== undefined && row.columnId !== null)
      .map(row => {
        const columnId = row.columnId;
        return columnId;
      });
    
    if (selectedIds.length === 0) {
      console.log('所选字段ID全部无效，无法执行删除');
      proxy.$modal.msgError("所选字段ID无效");
      return;
    }
    const beforeCount = columns.value.length;
  
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
      const shouldDelete = selectedIdsMap[rowColumnIdStr] === true;
      
      if (shouldDelete) {
        return false;
      } else {
        return true;
      }
    });
    selectedColumns.value = [];
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {
    console.log('用户取消删除操作');
  });
}


// HTML类型转换映射表
const htmlTypeMap = {
  "文本框": "input",
  "文本域": "textarea",
  "下拉框": "select",
  "单选框": "radio",
  "复选框": "checkbox",
  "日期控件": "datetime",
  "上传控件": "upload",
  "富文本": "editor",
  "富文本控件": "editor",
  "图片上传": "imageUpload",
  "文件上传": "fileUpload"
};

// 反向的HTML类型映射表（用于显示）
const htmlTypeReverseMap = {
  "input": "文本框",
  "textarea": "文本域",
  "select": "下拉框",
  "radio": "单选框",
  "checkbox": "复选框",
  "datetime": "日期控件",
  "upload": "上传控件",
  "editor": "富文本",
  "imageUpload": "图片上传",
  "fileUpload": "文件上传"
};

// 转换HTML类型从中文到英文
function convertHtmlType(columns) {
  if (!columns || !Array.isArray(columns)) return [];
  
  return columns.map(col => {
    if (col.htmlType && htmlTypeMap[col.htmlType]) {
      // 创建一个新对象以避免直接修改原始对象
      return {
        ...col,
        // 保存原始htmlType值
        originalHtmlType: col.htmlType,
        // 转换htmlType为英文值
        htmlType: htmlTypeMap[col.htmlType] || col.htmlType
      };
    }
    return col;
  });
}

/** 初始化数据 */
(() => {
  // 从路由query参数中获取数据
  const tables = route.query.tables;
  if (tables) {
    const data = JSON.parse(tables);
    // 转换HTML类型字段
    columns.value = convertHtmlType(data.rows || []);
    info.value = data.info || {};
    // 设置初始columnId计数器
    if (columns.value.length > 0) {
      const maxId = Math.max(...columns.value.map(col => col.columnId || 0));
      columnIdCounter.value = maxId + 1;
    }
  }
})();
</script>

<style scoped>
.mb8 {
  margin-bottom: 8px;
}
</style>