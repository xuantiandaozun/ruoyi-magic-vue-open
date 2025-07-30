<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="auto" class="flexible-search-form">
      <el-form-item label="厂商类型" prop="providerType" class="search-item">
        <el-select v-model="queryParams.providerType" placeholder="请选择厂商类型" clearable>
          <el-option
            v-for="dict in sys_provider_type"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="厂商品牌" prop="providerBrand" class="search-item">
        <el-select v-model="queryParams.providerBrand" placeholder="请选择厂商品牌" clearable>
          <el-option
            v-for="dict in sys_provider_brand"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="密钥类型" prop="keyType" class="search-item">
        <el-select v-model="queryParams.keyType" placeholder="请选择密钥类型" clearable>
          <el-option
            v-for="dict in sys_key_type"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="密钥名称/别名" prop="keyName" class="search-item">
        <el-input
          v-model="queryParams.keyName"
          placeholder="请输入密钥名称/别名"
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
          v-hasPermi="['system:secretKey:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['system:secretKey:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['system:secretKey:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['system:secretKey:export']"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="info"
          plain
          icon="Refresh"
          @click="handleSyncAliyunRegions"
          :loading="syncLoading"
        >同步阿里云地域</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="secretKeyList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="厂商类型" align="center" prop="providerType">
        <template #default="scope">
          <dict-tag :options="sys_provider_type" :value="scope.row.providerType"/>
        </template>
      </el-table-column>
      <el-table-column label="厂商名称" align="center" prop="providerName" />
      <el-table-column label="厂商品牌" align="center" prop="providerBrand">
        <template #default="scope">
          <dict-tag :options="sys_provider_brand" :value="scope.row.providerBrand"/>
        </template>
      </el-table-column>
      <el-table-column label="密钥类型" align="center" prop="keyType">
        <template #default="scope">
          <dict-tag :options="sys_key_type" :value="scope.row.keyType"/>
        </template>
      </el-table-column>
      <el-table-column label="密钥名称/别名" align="center" prop="keyName" />
      <el-table-column label="使用范围" align="center" prop="scopeType">
        <template #default="scope">
          <dict-tag :options="sys_scope_type" :value="scope.row.scopeType"/>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['system:secretKey:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['system:secretKey:remove']">删除</el-button>
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

    <!-- 添加或修改密钥管理对话框 -->
    <el-dialog :title="title" v-model="open" width="auto" :style="{minWidth: '300px', maxWidth: '40vw'}" append-to-body class="custom-dialog">
      <div v-loading="formLoading" style="min-height: 100px;">
        <el-form ref="secretKeyRef" :model="form" :rules="rules" label-width="auto" label-position="left" class="dialog-form">
        <el-form-item label="厂商类型" prop="providerType">
          <el-select v-model="form.providerType" placeholder="请选择厂商类型">
            <el-option
              v-for="dict in sys_provider_type"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="厂商名称" prop="providerName">
          <el-input v-model="form.providerName" placeholder="请输入厂商名称" />
        </el-form-item>
        <el-form-item label="厂商品牌" prop="providerBrand">
          <el-select v-model="form.providerBrand" placeholder="请选择厂商品牌" @change="handleProviderBrandChange">
            <el-option
              v-for="dict in sys_provider_brand"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="密钥类型" prop="keyType">
          <el-select v-model="form.keyType" placeholder="请选择密钥类型">
            <el-option
              v-for="dict in sys_key_type"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="密钥名称/别名" prop="keyName">
          <el-input v-model="form.keyName" placeholder="请输入密钥名称/别名" />
        </el-form-item>
        <el-form-item label="访问密钥" prop="accessKey">
          <el-input v-model="form.accessKey" placeholder="请输入访问密钥" />
        </el-form-item>
        <el-form-item label="密钥" prop="secretKey">
          <el-input v-model="form.secretKey" placeholder="请输入密钥" />
        </el-form-item>
        <el-form-item label="使用范围" prop="scopeType">
          <el-select v-model="form.scopeType" placeholder="请选择使用范围">
            <el-option
              v-for="dict in sys_scope_type"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="范围名称" prop="scopeName">
          <el-input v-model="form.scopeName" placeholder="请输入范围名称" />
        </el-form-item>
        <el-form-item label="地域" prop="region">
          <el-select 
            v-if="form.providerBrand === 'aliyun'"
            v-model="form.region" 
            placeholder="请选择地域" 
            multiple
            collapse-tags
            collapse-tags-tooltip
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="dict in aliyun_region"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
          <el-input 
            v-else
            v-model="form.region" 
            placeholder="请输入地域" 
          />
        </el-form-item>
        <el-form-item label="过期时间" prop="expireTime">
          <el-date-picker clearable
            v-model="form.expireTime"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择过期时间">
          </el-date-picker>
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

<script setup name="SecretKey">
import { listSecretKey, getSecretKey, delSecretKey, addSecretKey, updateSecretKey } from "@/api/system/secretKey";
import { syncAliyunRegions } from "@/api/system/aliyunRegion";
import { onMounted, onUnmounted, getCurrentInstance, ref, reactive, toRefs } from 'vue';

const { proxy } = getCurrentInstance();
// 模板引用
const secretKeyRef = ref();
const queryRef = ref();
const { sys_key_type,sys_provider_type,sys_provider_brand,sys_normal_disable,sys_scope_type,aliyun_region } = proxy.useDict('sys_key_type','sys_provider_type','sys_provider_brand','sys_normal_disable','sys_scope_type','aliyun_region');

const secretKeyList = ref([]);
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
    providerType: null,
    providerBrand: null,
    keyType: null,
    keyName: null,
  },
  rules: {
    id: [
      { required: true, message: "主键ID不能为空", trigger: "blur" }
    ],
    providerType: [
      { required: true, message: "厂商类型不能为空", trigger: "change" }
    ],
    providerName: [
      { required: true, message: "厂商名称不能为空", trigger: "blur" }
    ],
    keyType: [
      { required: true, message: "密钥类型不能为空", trigger: "change" }
    ],
    keyName: [
      { required: true, message: "密钥名称/别名不能为空", trigger: "blur" }
    ],
    scopeType: [
      { required: true, message: "使用范围不能为空", trigger: "change" }
    ],
    status: [
      { required: true, message: "状态不能为空", trigger: "change" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询密钥管理列表 */
async function getList() {
  loading.value = true;
  try {
    const response = await listSecretKey(queryParams.value);
    secretKeyList.value = response.rows;
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
    providerType: null,
    providerName: null,
    providerBrand: null,
    keyType: null,
    keyName: null,
    accessKey: null,
    secretKey: null,
    scopeType: null,
    scopeName: null,
    region: null,
    expireTime: null,
    status: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null,
    delFlag: null
  };
  if (secretKeyRef.value) {
    secretKeyRef.value.resetFields();
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
    title.value = "添加密钥管理";
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
    const response = await getSecretKey(editId);
    form.value = response;
    
    // 处理阿里云地域数据格式转换（编辑时回显）
    if (form.value.providerBrand === 'aliyun' && form.value.region && typeof form.value.region === 'string') {
      form.value.region = form.value.region.split(',').filter(item => item.trim());
    }
    
    open.value = true;
    title.value = "修改密钥管理";
  } catch (error) {
    proxy.$modal.msgError("获取数据失败：" + error);
  } finally {
    formLoading.value = false;
  }
}

/** 提交按钮 */
async function submitForm() {
  try {
    await secretKeyRef.value.validate();
  } catch (error) {
    // Validation failed, do nothing as Element Plus will highlight fields
    return;
  }

  formLoading.value = true;
  try {
    // 处理地域数据格式转换
    const submitData = { ...form.value };
    if (Array.isArray(submitData.region)) {
      submitData.region = submitData.region.join(',');
    }
    
    if (submitData.id != null) {
      await updateSecretKey(submitData);
      proxy.$modal.msgSuccess("修改成功");
    } else {
      await addSecretKey(submitData);
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
    await delSecretKey(deleteIds);
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
  proxy.download('system/secretKey/export', {
    ...queryParams.value
  }, 'secretKey_' + new Date().getTime() + '.xlsx')
}

/** 同步阿里云地域按钮操作 */
async function handleSyncAliyunRegions() {
  syncLoading.value = true;
  try {
    const response = await syncAliyunRegions();
    proxy.$modal.msgSuccess("阿里云地域同步成功");
  } catch (error) {
    proxy.$modal.msgError("同步失败：" + error.message);
  } finally {
    syncLoading.value = false;
  }
}

// 监听厂商品牌变化，清空地域字段
function handleProviderBrandChange() {
  // 当厂商品牌改变时，清空地域字段
  form.value.region = null;
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

