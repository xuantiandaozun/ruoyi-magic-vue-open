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
      <el-table-column label="文件大小" align="center" prop="fileSize">
        <template #default="scope">
          {{ formatFileSize(scope.row.fileSize) }}
        </template>
      </el-table-column>
      <el-table-column label="文件地址" align="center" prop="fileUrl" width="200">
        <template #default="scope">
          <div v-if="scope.row.fileUrl" class="file-url-container">
            <el-tooltip :content="scope.row.fileUrl" placement="top">
              <span class="file-url-text" @click="copyToClipboard(scope.row.fileUrl)">
                {{ truncateUrl(scope.row.fileUrl) }}
              </span>
            </el-tooltip>
            <el-button 
              type="text" 
              size="small" 
              icon="DocumentCopy" 
              @click="copyToClipboard(scope.row.fileUrl)"
              class="copy-btn"
              title="复制地址"
            />
          </div>
          <span v-else>-</span>
        </template>
      </el-table-column>
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
        <!-- 新增时显示文件选择器 -->
        <el-form-item v-if="!form.recordId" label="选择文件" prop="file">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :show-file-list="true"
            :limit="1"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            action="#"
          >
            <el-button type="primary">选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">请选择要上传的文件</div>
            </template>
          </el-upload>
        </el-form-item>
        
        <!-- 编辑时显示所有字段 -->
        <template v-if="form.recordId">
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
            <el-input :value="formatFileSize(form.fileSize)" placeholder="文件大小" readonly />
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
        </template>
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
import { delRecord, getRecord, listRecord, updateRecord } from "@/api/system/record";
import request from '@/utils/request';
import { getCurrentInstance, onMounted, onUnmounted, reactive, ref, toRefs } from 'vue';

const { proxy } = getCurrentInstance();
// 模板引用
const recordRef = ref();
const queryRef = ref();
const uploadRef = ref();
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
const selectedFile = ref(null);

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
    file: [
      { required: true, message: "请选择要上传的文件", trigger: "change" }
    ],
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
    delFlag: null,
    file: null
  };
  selectedFile.value = null;
  if (recordRef.value) {
    recordRef.value.resetFields();
  }
  if (uploadRef.value) {
    uploadRef.value.clearFiles();
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

/** 文件选择变化处理 */
function handleFileChange(file, fileList) {
  selectedFile.value = file.raw;
  form.value.file = file.raw;
}

/** 文件移除处理 */
function handleFileRemove(file, fileList) {
  selectedFile.value = null;
  form.value.file = null;
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
  if (!recordRef.value) return;
  
  try {
    const valid = await recordRef.value.validate();
    if (valid) {
      formLoading.value = true;
      
      if (form.value.recordId != null) {
        // 编辑模式
        await updateRecord(form.value);
        proxy.$modal.msgSuccess("修改成功");
      } else {
        // 新增模式 - 直接上传文件，接口会自动新增记录
        if (!selectedFile.value) {
          proxy.$modal.msgError("请选择要上传的文件");
          formLoading.value = false;
          return;
        }
        
        // 创建FormData进行文件上传
        const formData = new FormData();
        formData.append('file', selectedFile.value);
        
        // 调用通用上传接口，会自动新增记录
        await request({
          url: '/common/upload',
          method: 'post',
          data: formData,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        proxy.$modal.msgSuccess("文件上传成功");
      }
      
      open.value = false;
      await getList();
    }
  } catch (error) {
    console.error('提交失败:', error);
    proxy.$modal.msgError("操作失败：" + (error.message || error));
  } finally {
    formLoading.value = false;
  }
}

/** 获取文件类型 */
function getFileType(filename) {
  const ext = getFileExtension(filename).toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) {
    return 'image';
  } else if (['pdf'].includes(ext)) {
    return 'pdf';
  } else if (['doc', 'docx'].includes(ext)) {
    return 'word';
  } else if (['xls', 'xlsx'].includes(ext)) {
    return 'excel';
  } else if (['ppt', 'pptx'].includes(ext)) {
    return 'ppt';
  } else if (['txt'].includes(ext)) {
    return 'txt';
  } else if (['zip', 'rar', '7z'].includes(ext)) {
    return 'archive';
  } else {
    return 'other';
  }
}

/** 获取文件扩展名 */
function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
}

/** 复制到剪切板 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    proxy.$modal.msgSuccess("地址已复制到剪切板");
  } catch (error) {
    // 降级方案：使用传统方法
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      proxy.$modal.msgSuccess("地址已复制到剪切板");
    } catch (err) {
      proxy.$modal.msgError("复制失败，请手动复制");
    }
    document.body.removeChild(textArea);
  }
}

/** 截断URL显示 */
function truncateUrl(url) {
  if (!url) return '';
  if (url.length <= 30) return url;
  return url.substring(0, 15) + '...' + url.substring(url.length - 15);
}

/** 格式化文件大小显示 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 KB';
  const kb = bytes / 1024;
  return kb.toFixed(2) + ' KB';
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



<style scoped>
.file-url-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-url-text {
  cursor: pointer;
  color: #409eff;
  text-decoration: none;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-url-text:hover {
  text-decoration: underline;
  color: #337ecc;
}

.copy-btn {
  padding: 4px;
  min-width: auto;
  margin-left: 4px;
}

.copy-btn:hover {
  background-color: #f5f7fa;
}
</style>


