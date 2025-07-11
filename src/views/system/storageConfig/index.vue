<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="auto" class="flexible-search-form">
      <el-form-item label="存储类型" prop="storageType" class="search-item">
        <el-select v-model="queryParams.storageType" placeholder="请选择存储类型" clearable>
          <el-option
            v-for="dict in sys_storage_type"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="配置名称" prop="configName" class="search-item">
        <el-input
          v-model="queryParams.configName"
          placeholder="请输入配置名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="是否默认配置" prop="isDefault" class="search-item">
        <el-select v-model="queryParams.isDefault" placeholder="请选择是否默认配置" clearable>
          <el-option
            v-for="dict in sys_yes_no"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status" class="search-item">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
          <el-option
            v-for="dict in sys_normal_disable"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
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
          v-hasPermi="['system:storageConfig:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['system:storageConfig:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['system:storageConfig:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['system:storageConfig:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="storageConfigList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="存储类型" align="center" prop="storageType">
        <template #default="scope">
          <dict-tag :options="sys_storage_type" :value="scope.row.storageType"/>
        </template>
      </el-table-column>
      <el-table-column label="配置名称" align="center" prop="configName" />
      <el-table-column label="是否默认配置" align="center" prop="isDefault">
        <template #default="scope">
          <dict-tag :options="sys_yes_no" :value="scope.row.isDefault"/>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :options="sys_normal_disable" :value="scope.row.status"/>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['system:storageConfig:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['system:storageConfig:remove']">删除</el-button>
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

    <!-- 添加或修改存储配置对话框 -->
    <el-dialog :title="title" v-model="open" width="auto" :style="{minWidth: '300px', maxWidth: '40vw'}" append-to-body class="custom-dialog">
      <div v-loading="formLoading" style="min-height: 100px;">
        <el-form ref="storageConfigRef" :model="form" :rules="rules" label-width="auto" label-position="left" class="dialog-form">
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
        <el-form-item label="配置名称" prop="configName">
          <el-input v-model="form.configName" placeholder="请输入配置名称" />
        </el-form-item>
        <el-form-item label="是否默认配置" prop="isDefault">
          <el-radio-group v-model="form.isDefault">
            <el-radio
              v-for="dict in sys_yes_no"
              :key="dict.value"
              :label="dict.value"
            >{{ dict.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio
              v-for="dict in sys_normal_disable"
              :key="dict.value"
              :label="dict.value"
            >{{ dict.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="配置数据" prop="configData">
          <el-input v-model="form.configData" type="textarea" placeholder="请输入内容" />
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

<script setup name="StorageConfig">
import { listStorageConfig, getStorageConfig, delStorageConfig, addStorageConfig, updateStorageConfig } from "@/api/system/storageConfig";
import { onMounted, onUnmounted, getCurrentInstance, ref, reactive, toRefs } from 'vue';

const { proxy } = getCurrentInstance();
// 模板引用
const storageConfigRef = ref();
const queryRef = ref();
const { sys_storage_type,sys_yes_no,sys_normal_disable } = proxy.useDict('sys_storage_type','sys_yes_no','sys_normal_disable');

const storageConfigList = ref([]);
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
    storageType: null,
    configName: null,
    isDefault: null,
    status: null,
  },
  rules: {
    storageType: [
      { required: true, message: "存储类型不能为空", trigger: "change" }
    ],
    configName: [
      { required: true, message: "配置名称不能为空", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询存储配置列表 */
async function getList() {
  loading.value = true;
  try {
    const response = await listStorageConfig(queryParams.value);
    storageConfigList.value = response.rows;
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
    configId: null,
    storageType: null,
    configName: null,
    isDefault: null,
    status: null,
    configData: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null,
    delFlag: null
  };
  if (storageConfigRef.value) {
    storageConfigRef.value.resetFields();
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
  ids.value = selection.map(item => item.configId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  try {
    reset();
    formLoading.value = false; // 确保加载状态重置
    open.value = true;
    title.value = "添加存储配置";
  } catch (error) {
    proxy.$modal.msgError("操作异常：" + error);
    formLoading.value = false;
  }
}

/** 修改按钮操作 */
async function handleUpdate(row) {
  reset();
  const editId = row.configId || ids.value[0];
  formLoading.value = true;
  try {
    const response = await getStorageConfig(editId);
    form.value = response;
    open.value = true;
    title.value = "修改存储配置";
  } catch (error) {
    proxy.$modal.msgError("获取数据失败：" + error);
  } finally {
    formLoading.value = false;
  }
}

/** 提交按钮 */
async function submitForm() {
  try {
    await storageConfigRef.value.validate();
  } catch (error) {
    // Validation failed, do nothing as Element Plus will highlight fields
    return;
  }

  formLoading.value = true;
  try {
    
    if (form.value.configId != null) {
      await updateStorageConfig(form.value);
      proxy.$modal.msgSuccess("修改成功");
    } else {
      await addStorageConfig(form.value);
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
  const deleteIds = row.configId || ids.value;
  try {
    await proxy.$modal.confirm('是否确认删除${functionName}编号为"' + deleteIds + '"的数据项？');
    await delStorageConfig(deleteIds);
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
  proxy.download('system/storageConfig/export', {
    ...queryParams.value
  }, 'storageConfig_' + new Date().getTime() + '.xlsx')
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

