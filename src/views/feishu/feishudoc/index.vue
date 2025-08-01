<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="auto" class="flexible-search-form">
      <el-form-item label="文档名称" prop="name" class="search-item">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入文档名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="文档类型" prop="type" class="search-item">
        <el-select v-model="queryParams.type" placeholder="请选择文档类型" clearable>
          <el-option label="文档" value="doc" />
          <el-option label="表格" value="sheet" />
          <el-option label="多维表格" value="bitable" />
          <el-option label="思维笔记" value="mindnote" />
          <el-option label="文件" value="file" />
          <el-option label="文件夹" value="folder" />
        </el-select>
      </el-form-item>
      <el-form-item label="关联密钥" prop="keyName" class="search-item">
        <el-input
          v-model="queryParams.keyName"
          placeholder="请输入关联的密钥名称"
          clearable
          @keyup.enter="handleQuery"
        />
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
          v-hasPermi="['feishu:feishudoc:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['feishu:feishudoc:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['feishu:feishudoc:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['feishu:feishudoc:export']"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="info"
          plain
          icon="Refresh"
          @click="handleSync"
          :loading="syncLoading"
        >同步飞书文档</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="feishudocList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="文档名称" align="center" prop="name" min-width="200" show-overflow-tooltip />
      <el-table-column label="文档类型" align="center" prop="type" width="120">
        <template #default="scope">
          <el-tag :type="getTypeTagType(scope.row.type)" size="small">
            {{ getTypeLabel(scope.row.type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="文档链接" align="center" width="120">
        <template #default="scope">
          <el-button 
            v-if="scope.row.url" 
            link 
            type="primary" 
            icon="Link" 
            @click="openUrl(scope.row.url)"
            size="small"
          >
            访问文档
          </el-button>
          <span v-else class="text-gray-400">无链接</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" width="180">
        <template #default="scope">
          {{ formatTimestamp(scope.row.feishuCreatedTime) }}
        </template>
      </el-table-column>
      <el-table-column label="修改时间" align="center" width="180">
        <template #default="scope">
          {{ formatTimestamp(scope.row.feishuModifiedTime) }}
        </template>
      </el-table-column>
      <el-table-column label="关联密钥" align="center" prop="keyName" width="120" show-overflow-tooltip />
      <el-table-column label="操作" align="center" width="160" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['feishu:feishudoc:edit']" size="small">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['feishu:feishudoc:remove']" size="small">删除</el-button>
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

    <!-- 添加或修改飞书文档信息对话框 -->
    <el-dialog :title="title" v-model="open" width="auto" :style="{minWidth: '300px', maxWidth: '40vw'}" append-to-body class="custom-dialog">
      <div v-loading="formLoading" style="min-height: 100px;">
        <el-form ref="feishudocRef" :model="form" :rules="rules" label-width="auto" label-position="left" class="dialog-form">
        <el-form-item label="文档token" prop="token">
          <el-input v-model="form.token" placeholder="请输入文档token" />
        </el-form-item>
        <el-form-item label="文档名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入文档名称" />
        </el-form-item>
        <el-form-item label="文档访问URL" prop="url">
          <el-input v-model="form.url" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="拥有者ID" prop="ownerId">
          <el-input v-model="form.ownerId" placeholder="请输入拥有者ID" />
        </el-form-item>
        <el-form-item label="父文件夹token" prop="parentToken">
          <el-input v-model="form.parentToken" placeholder="请输入父文件夹token" />
        </el-form-item>
        <el-form-item label="是否为文件夹(0-否,1-是)" prop="isFolder">
          <el-input v-model="form.isFolder" placeholder="请输入是否为文件夹(0-否,1-是)" />
        </el-form-item>
        <el-form-item label="文档内容(缓存)">
          <editor v-model="form.content" :min-height="192"/>
        </el-form-item>
        <el-form-item label="飞书创建时间(时间戳)" prop="feishuCreatedTime">
          <el-input v-model="form.feishuCreatedTime" placeholder="请输入飞书创建时间(时间戳)" />
        </el-form-item>
        <el-form-item label="飞书修改时间(时间戳)" prop="feishuModifiedTime">
          <el-input v-model="form.feishuModifiedTime" placeholder="请输入飞书修改时间(时间戳)" />
        </el-form-item>
        <el-form-item label="关联的密钥名称" prop="keyName">
          <el-input v-model="form.keyName" placeholder="请输入关联的密钥名称" />
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

<script setup name="Feishudoc">
import { addFeishudoc, delFeishudoc, getFeishudoc, listFeishudoc, syncFeishudoc, updateFeishudoc } from "@/api/feishu/feishudoc";
import { getCurrentInstance, onMounted, onUnmounted, reactive, ref, toRefs } from 'vue';

const { proxy } = getCurrentInstance();
// 模板引用
const feishudocRef = ref();
const queryRef = ref();

const feishudocList = ref([]);
const open = ref(false);
const loading = ref(true);
const formLoading = ref(false);
const syncLoading = ref(false);
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
    token: null,
    name: null,
    type: null,
    url: null,
    ownerId: null,
    parentToken: null,
    isFolder: null,
    content: null,
    feishuCreatedTime: null,
    feishuModifiedTime: null,
    keyName: null,
  },
  rules: {
    token: [
      { required: true, message: "文档token不能为空", trigger: "blur" }
    ],
    name: [
      { required: true, message: "文档名称不能为空", trigger: "blur" }
    ],
    type: [
      { required: true, message: "文档类型(doc/sheet/bitable/mindnote/file/folder)不能为空", trigger: "change" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询飞书文档信息列表 */
async function getList() {
  loading.value = true;
  try {
    const response = await listFeishudoc(queryParams.value);
    feishudocList.value = response.rows;
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
    id: null,
    token: null,
    name: null,
    type: null,
    url: null,
    ownerId: null,
    parentToken: null,
    isFolder: null,
    content: null,
    feishuCreatedTime: null,
    feishuModifiedTime: null,
    keyName: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null
  };
  if (feishudocRef.value) {
    feishudocRef.value.resetFields();
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
  ids.value = selection.map(item => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  try {
    reset();
    formLoading.value = false; // 确保加载状态重置
    open.value = true;
    title.value = "添加飞书文档信息";
  } catch (error) {
    proxy.$modal.msgError("操作异常：" + error);
    formLoading.value = false;
  }
}

/** 修改按钮操作 */
async function handleUpdate(row) {
  reset();
  const editId = row.id || ids.value[0];
  formLoading.value = true;
  try {
    const response = await getFeishudoc(editId);
    form.value = response;
    open.value = true;
    title.value = "修改飞书文档信息";
  } catch (error) {
    proxy.$modal.msgError("获取数据失败：" + error);
  } finally {
    formLoading.value = false;
  }
}

/** 提交按钮 */
async function submitForm() {
  try {
    await feishudocRef.value.validate();
  } catch (error) {
    // Validation failed, do nothing as Element Plus will highlight fields
    return;
  }

  formLoading.value = true;
  try {
    
    if (form.value.id != null) {
      await updateFeishudoc(form.value);
      proxy.$modal.msgSuccess("修改成功");
    } else {
      await addFeishudoc(form.value);
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
  const deleteIds = row.id || ids.value;
  try {
    await proxy.$modal.confirm('是否确认删除${functionName}编号为"' + deleteIds + '"的数据项？');
    await delFeishudoc(deleteIds);
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
  proxy.download('feishu/feishudoc/export', {
    ...queryParams.value
  }, 'feishudoc_' + new Date().getTime() + '.xlsx')
}

/** 同步飞书文档操作 */
async function handleSync() {
  syncLoading.value = true;
  try {
    const response = await syncFeishudoc({
      keyName: queryParams.value.keyName || null
    });
    proxy.$modal.msgSuccess(response.msg || "同步成功");
    // 同步完成后刷新列表
    getList();
  } catch (error) {
    proxy.$modal.msgError("同步失败：" + error);
  } finally {
    syncLoading.value = false;
  }
}

/** 获取文档类型标签样式 */
function getTypeTagType(type) {
  const typeMap = {
    'doc': 'primary',
    'sheet': 'success', 
    'bitable': 'warning',
    'mindnote': 'info',
    'file': '',
    'folder': 'danger'
  };
  return typeMap[type] || '';
}

/** 获取文档类型显示标签 */
function getTypeLabel(type) {
  const labelMap = {
    'doc': '文档',
    'sheet': '表格',
    'bitable': '多维表格', 
    'mindnote': '思维笔记',
    'file': '文件',
    'folder': '文件夹'
  };
  return labelMap[type] || type;
}

/** 格式化时间戳 */
function formatTimestamp(timestamp) {
  if (!timestamp) return '-';
  const date = new Date(parseInt(timestamp));
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/** 打开URL链接 */
function openUrl(url) {
  if (url) {
    window.open(url, '_blank');
  }
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
  syncLoading.value = false;
});
</script>

