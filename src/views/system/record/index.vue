<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="auto" class="flexible-search-form">
      <el-form-item label="原始文件名" prop="originalFilename" class="search-item">
        <el-input
          v-model="queryParams.originalFilename"
          placeholder="请输入原始文件名"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="文件类型" prop="fileType" class="search-item">
        <el-select v-model="queryParams.fileType" placeholder="请选择文件类型" clearable>
          <el-option
            v-for="dict in sys_file_type"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="上传状态" prop="uploadStatus" class="search-item">
        <el-select v-model="queryParams.uploadStatus" placeholder="请选择上传状态" clearable>
          <el-option
            v-for="dict in sys_success_fail"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime" class="search-item">
        <el-date-picker clearable
          v-model="queryParams.createTime"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择创建时间">
        </el-date-picker>
      </el-form-item>
      <el-form-item class="search-buttons">
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
          v-hasPermi="['system:record:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['system:record:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['system:record:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['system:record:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="recordList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="原始文件名" align="center" prop="originalFilename" />
      <el-table-column label="文件大小" align="center" prop="fileSize" />
      <el-table-column label="文件类型" align="center" prop="fileType">
        <template #default="scope">
          <dict-tag :options="sys_file_type" :value="scope.row.fileType"/>
        </template>
      </el-table-column>
      <el-table-column label="上传状态" align="center" prop="uploadStatus">
        <template #default="scope">
          <dict-tag :options="sys_success_fail" :value="scope.row.uploadStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['system:record:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['system:record:remove']">删除</el-button>
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

    <!-- 添加或修改文件上传记录对话框 -->
    <el-dialog :title="title" v-model="open" width="auto" :style="{minWidth: '300px', maxWidth: '40vw'}" append-to-body class="custom-dialog">
      <div v-loading="formLoading" style="min-height: 100px;">
        <el-form ref="recordRef" :model="form" :rules="rules" label-width="auto" label-position="left" class="dialog-form">
        <el-form-item label="原始文件名" prop="originalFilename">
          <el-input v-model="form.originalFilename" placeholder="请输入原始文件名" />
        </el-form-item>
        <el-form-item label="存储文件名" prop="storedFilename">
          <el-input v-model="form.storedFilename" placeholder="请输入存储文件名" />
        </el-form-item>
        <el-form-item label="文件路径" prop="filePath">
          <el-input v-model="form.filePath" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="文件访问URL" prop="fileUrl">
          <el-input v-model="form.fileUrl" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="文件大小" prop="fileSize">
          <el-input v-model="form.fileSize" placeholder="请输入文件大小" />
        </el-form-item>
        <el-form-item label="文件类型" prop="fileType">
          <el-select v-model="form.fileType" placeholder="请选择文件类型">
            <el-option
              v-for="dict in sys_file_type"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="文件扩展名" prop="fileExtension">
          <el-input v-model="form.fileExtension" placeholder="请输入文件扩展名" />
        </el-form-item>
        <el-form-item label="存储类型" prop="storageType">
          <el-select v-model="form.storageType" placeholder="请选择存储类型">
            <el-option
              v-for="dict in sys_storage_type"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="关联的配置ID" prop="configId">
          <el-input v-model="form.configId" placeholder="请输入关联的配置ID" />
        </el-form-item>
        <el-form-item label="上传状态" prop="uploadStatus">
          <el-radio-group v-model="form.uploadStatus">
            <el-radio
              v-for="dict in sys_success_fail"
              :key="dict.value"
              :label="dict.value"
            >{{ dict.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="错误信息" prop="errorMessage">
          <el-input v-model="form.errorMessage" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="上传IP地址" prop="uploadIp">
          <el-input v-model="form.uploadIp" placeholder="请输入上传IP地址" />
        </el-form-item>
        <el-form-item label="用户代理" prop="userAgent">
          <el-input v-model="form.userAgent" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancel">取 消</el-button>
          <el-button type="primary" @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Record">
import { listRecord, getRecord, delRecord, addRecord, updateRecord } from "@/api/system/record";
import { onMounted, onUnmounted, getCurrentInstance, ref, reactive, toRefs } from 'vue';

const { proxy } = getCurrentInstance();
// 模板引用
const recordRef = ref();
const queryRef = ref();
const { sys_success_fail,sys_storage_type,sys_file_type } = proxy.useDict('sys_success_fail','sys_storage_type','sys_file_type');

const recordList = ref([]);
const open = ref(false);
const loading = ref(true);
const formLoading = ref(false);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    originalFilename: null,
    fileType: null,
    uploadStatus: null,
    createTime: null,
  },
  rules: {
    originalFilename: [
      { required: true, message: "原始文件名不能为空", trigger: "blur" }
    ],
    storedFilename: [
      { required: true, message: "存储文件名不能为空", trigger: "blur" }
    ],
    storageType: [
      { required: true, message: "存储类型不能为空", trigger: "change" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询文件上传记录列表 */
async function getList() {
  loading.value = true;
  try {
    const response = await listRecord(queryParams.value);
    recordList.value = response.rows;
    total.value = response.total;
  } catch (error) {
    proxy.$modal.msgError("获取列表失败：" + error);
  } finally {
    loading.value = false;
  }
}

// 取消按钮
function cancel() {
  formLoading.value = false;
  open.value = false;
  reset();
}

// 表单重置
function reset() {
  form.value = {
    recordId: null,
    originalFilename: null,
    storedFilename: null,
    filePath: null,
    fileUrl: null,
    fileSize: null,
    fileType: null,
    fileExtension: null,
    mimeType: null,
    storageType: null,
    configId: null,
    uploadStatus: null,
    errorMessage: null,
    uploadIp: null,
    userAgent: null,
    createBy: null,
    createTime: null,
    remark: null,
    delFlag: null
  };
  if (recordRef.value) {
    recordRef.value.resetFields();
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  if (queryRef.value) {
    queryRef.value.resetFields();
  }
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
  try {
    reset();
    formLoading.value = false; // 确保加载状态重置
    open.value = true;
    title.value = "添加文件上传记录";
  } catch (error) {
    proxy.$modal.msgError("操作异常：" + error);
    formLoading.value = false;
  }
}

/** 修改按钮操作 */
async function handleUpdate(row) {
  reset();
  const editId = row.recordId || ids.value[0];
  formLoading.value = true;
  try {
    const response = await getRecord(editId);
    form.value = response;
    open.value = true;
    title.value = "修改文件上传记录";
  } catch (error) {
    proxy.$modal.msgError("获取数据失败：" + error);
  } finally {
    formLoading.value = false;
  }
}

/** 提交按钮 */
async function submitForm() {
  try {
    await recordRef.value.validate();
  } catch (error) {
    // Validation failed, do nothing as Element Plus will highlight fields
    return;
  }

  formLoading.value = true;
  try {
    
    if (form.value.recordId != null) {
      await updateRecord(form.value);
      proxy.$modal.msgSuccess("修改成功");
    } else {
      await addRecord(form.value);
      proxy.$modal.msgSuccess("新增成功");
    }
    open.value = false;
    getList();
  } catch (error) {
    proxy.$modal.msgError("操作失败：" + error);
  } finally {
    formLoading.value = false;
  }
}

/** 删除按钮操作 */
async function handleDelete(row) {
  const deleteIds = row.recordId || ids.value;
  try {
    await proxy.$modal.confirm('是否确认删除${functionName}编号为"' + deleteIds + '"的数据项？');
    await delRecord(deleteIds);
    getList();
    proxy.$modal.msgSuccess("删除成功");
  } catch (error) {
    if (error === 'cancel') {
      // 用户取消操作，无需提示
    } else {
      proxy.$modal.msgError("删除失败：" + error);
    }
  }
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('system/record/export', {
    ...queryParams.value
  }, 'record_' + new Date().getTime() + '.xlsx')
}

// 在组件挂载后执行查询操作
onMounted(() => {
  getList();
});

// 在组件卸载前清理资源
onUnmounted(() => {
  // 确保所有加载状态被重置，防止内存泄漏
  loading.value = false;
  formLoading.value = false;
});
</script>

